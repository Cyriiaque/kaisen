"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "kaisen_session";

const signupSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

async function createSession(userId: string) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 jours

  // On supprime les anciennes sessions de cet utilisateur pour simplifier
  await prisma.session.deleteMany({ where: { userId } });

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    // Session expirée: nettoyage
    await prisma.session.delete({ where: { id: session.id } });
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    avatar: session.user.avatar,
    theme: session.user.theme || "light",
    notificationsEnabled: session.user.notificationsEnabled ?? true,
  };
}

export async function registerAction(_: unknown, formData: FormData) {
  const parsed = signupSchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
  });

  if (!parsed.success) {
    return { error: "Invalid form data" };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email already in use" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, name, passwordHash } });

  redirect("/login?registered=1");
}

export async function loginAction(_: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
  });
  if (!parsed.success) {
    return { error: "Invalid credentials" };
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "Invalid credentials" };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { error: "Invalid credentials" };

  await createSession(user.id);

  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    cookieStore.delete(SESSION_COOKIE_NAME);
  }

  redirect("/login");
}

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Le mot de passe est requis"),
});

export async function deleteAccount(_: unknown, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Non authentifié" };
  }

  const parsed = deleteAccountSchema.safeParse({
    password: formData.get("password")?.toString() ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Données invalides" };
  }

  const { password } = parsed.data;

  // Récupérer l'utilisateur avec le mot de passe hashé
  const userWithPassword = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, passwordHash: true },
  });

  if (!userWithPassword) {
    return { error: "Utilisateur introuvable" };
  }

  // Vérifier le mot de passe
  const valid = await bcrypt.compare(password, userWithPassword.passwordHash);
  if (!valid) {
    return { error: "Mot de passe incorrect" };
  }

  // Supprimer toutes les sessions de l'utilisateur
  const cookieStore = await cookies();
  await prisma.session.deleteMany({ where: { userId: user.id } });
  cookieStore.delete(SESSION_COOKIE_NAME);

  // Supprimer l'utilisateur (cascade supprimera automatiquement habitudes, logs, relations, etc.)
  await prisma.user.delete({
    where: { id: user.id },
  });

  redirect("/login?deleted=1");
}

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  avatar: z
    .string()
    .refine(
      (val) => !val || val === "" || z.string().url().safeParse(val).success,
      "URL d'avatar invalide",
    )
    .optional(),
  theme: z.enum(["light", "dark"], {
    errorMap: () => ({ message: "Le thème doit être 'light' ou 'dark'" }),
  }),
  notificationsEnabled: z.boolean(),
});

export async function updateProfile(_: unknown, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Non authentifié" };
  }

  const avatarValue = formData.get("avatar")?.toString() ?? "";
  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    avatar: avatarValue === "" ? undefined : avatarValue,
    theme: formData.get("theme")?.toString() ?? "light",
    notificationsEnabled: formData.get("notificationsEnabled") === "true",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Données invalides",
    };
  }

  const { name, email, avatar, theme, notificationsEnabled } = parsed.data;

  // Vérifier si l'email est déjà utilisé par un autre utilisateur
  if (email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "Cet email est déjà utilisé" };
    }
  }

  // Mettre à jour le profil
  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      email,
      avatar: avatar || null,
      theme,
      notificationsEnabled,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

