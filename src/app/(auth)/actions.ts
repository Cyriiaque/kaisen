"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, createSession, getSessionCookieName } from "@/lib/auth-utils";
import { uploadAvatar, deleteAvatar } from "@/app/(app)/upload-actions";

const signupSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

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
  const token = cookieStore.get(getSessionCookieName())?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    cookieStore.delete(getSessionCookieName());
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

  const userWithPassword = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, passwordHash: true },
  });

  if (!userWithPassword) {
    return { error: "Utilisateur introuvable" };
  }

  const valid = await bcrypt.compare(password, userWithPassword.passwordHash);
  if (!valid) {
    return { error: "Mot de passe incorrect" };
  }

  const cookieStore = await cookies();
  await prisma.session.deleteMany({ where: { userId: user.id } });
  cookieStore.delete(getSessionCookieName());

  await prisma.user.delete({
    where: { id: user.id },
  });

  redirect("/login?deleted=1");
}

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  avatar: z.string().optional(),
  theme: z.enum(["light", "dark"]),
  notificationsEnabled: z.boolean(),
  password: z.string().optional(),
});

export async function updateProfile(_: unknown, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Non authentifié" };
  }

  const avatarFile = formData.get("avatarFile") as File | null;
  let avatarPath = formData.get("avatar")?.toString() ?? "";
  const oldAvatarPath = user.avatar;

  if (avatarFile && avatarFile.size > 0) {
    if (oldAvatarPath) {
      await deleteAvatar(oldAvatarPath);
    }

    const uploadFormData = new FormData();
    uploadFormData.append("avatar", avatarFile);
    const uploadResult = await uploadAvatar(uploadFormData);
    
    if (uploadResult.error) {
      return { error: uploadResult.error };
    }
    
    if (uploadResult.path) {
      avatarPath = uploadResult.path;
    }
  }

  const emailChanged = formData.get("email")?.toString() !== user.email;
  const password = formData.get("password")?.toString() ?? "";

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    avatar: avatarPath === "" ? undefined : avatarPath,
    theme: formData.get("theme")?.toString() ?? "light",
    notificationsEnabled: formData.get("notificationsEnabled") === "true",
    password: emailChanged ? password : undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Données invalides",
    };
  }

  const { name, email, avatar, theme, notificationsEnabled } = parsed.data;

  if (email !== user.email) {
    if (!password || password === "") {
      return { error: "Le mot de passe est requis pour changer l'email" };
    }

    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, passwordHash: true },
    });

    if (!userWithPassword) {
      return { error: "Utilisateur introuvable" };
    }

    const valid = await bcrypt.compare(password, userWithPassword.passwordHash);
    if (!valid) {
      return { error: "Mot de passe incorrect" };
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "Cet email est déjà utilisé" };
    }
  }

  if ((!avatar || avatar === "") && oldAvatarPath && oldAvatarPath !== avatarPath) {
    await deleteAvatar(oldAvatarPath);
  }

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
  return { success: true, avatar: avatar || null };
}

