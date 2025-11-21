"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

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
      },
    });
  } catch (error) {
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
        where: { id },
        data: { name, color },
      }),
      prisma.habit.updateMany({
        where: { categoryId: id },
        data: { color },
      }),
    ]);
  } catch (error) {
    return { error: "Impossible de mettre à jour cette catégorie" };
  }

  revalidatePath("/habits");
  revalidatePath("/");
  revalidatePath("/stats");
  revalidatePath("/calendar");

  return { success: true };
}

export async function deleteCategory(id: string) {
  try {
    // Détacher les habitudes de cette catégorie avant suppression
    await prisma.$transaction([
      prisma.habit.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      }),
      prisma.category.delete({
        where: { id },
      }),
    ]);

    revalidatePath("/habits");
    revalidatePath("/");
    revalidatePath("/stats");
    revalidatePath("/calendar");

    return { success: true };
  } catch (error) {
    return { error: "Impossible de supprimer cette catégorie" };
  }
}


