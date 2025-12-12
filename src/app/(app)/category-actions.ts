"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";

const CategorySchema = z.object({
  name: z.string().min(1, "Le nom de la catégorie est requis"),
  color: z.enum([
    "purple",
    "pink",
    "blue",
    "green",
    "orange",
    "teal",
    "red",
    "yellow",
  ]),
});

export async function createCategory(_: unknown, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const parsed = CategorySchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    color: formData.get("color")?.toString() ?? "purple",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Données invalides",
    };
  }

  const { name, color } = parsed.data;

  try {
    await prisma.category.create({
      data: {
        name,
        color,
        userId: user.id,
      },
    });
  } catch {
    return { error: "Une catégorie avec ce nom existe déjà" };
  }

  revalidatePath("/habits");
  revalidatePath("/");
  revalidatePath("/stats");
  revalidatePath("/calendar");

  return { success: true };
}

export async function updateCategory(
  id: string,
  _: unknown,
  formData: FormData,
) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const parsed = CategorySchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    color: formData.get("color")?.toString() ?? "purple",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Données invalides",
    };
  }

  const { name, color } = parsed.data;

  try {
    await prisma.$transaction([
      prisma.category.update({
        where: { id, userId: user.id },
        data: { name, color },
      }),
      prisma.habit.updateMany({
        where: { categoryId: id, userId: user.id },
        data: { color },
      }),
    ]);
  } catch {
    return { error: "Impossible de mettre à jour cette catégorie" };
  }

  revalidatePath("/habits");
  revalidatePath("/");
  revalidatePath("/stats");
  revalidatePath("/calendar");

  return { success: true };
}

export async function deleteCategory(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  try {
  await prisma.$transaction([
    prisma.habit.updateMany({
        where: { categoryId: id, userId: user.id },
      data: { categoryId: null },
    }),
    prisma.category.delete({
        where: { id, userId: user.id },
    }),
  ]);

  revalidatePath("/habits");
  revalidatePath("/");
  revalidatePath("/stats");
  revalidatePath("/calendar");

  return { success: true };
  } catch {
    return { error: "Impossible de supprimer cette catégorie" };
  }
}


