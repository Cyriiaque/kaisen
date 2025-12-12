"use server";

import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { revalidatePath } from "next/cache";


export async function uploadAvatar(formData: FormData) {
  const file = formData.get("avatar") as File | null;

  if (!file) {
    return { error: "Aucun fichier fourni" };
  }

  if (!file.type.startsWith("image/")) {
    return { error: "Le fichier doit être une image" };
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { error: "Le fichier est trop volumineux (max 5MB)" };
  }

  try {
    const uploadsDir = join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `${timestamp}-${randomString}.${extension}`;
    const filepath = join(uploadsDir, filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    const relativePath = `/uploads/avatars/${filename}`;

    revalidatePath("/profile");
    return { success: true, path: relativePath };
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    return { error: "Erreur lors de l'upload du fichier" };
  }
}

export async function deleteAvatar(avatarPath: string | null | undefined) {
  if (!avatarPath) {
    return { success: true };
  }

  if (!avatarPath.startsWith("/uploads/avatars/")) {
    return { success: true };
  }

  try {
    const filename = avatarPath.replace("/uploads/avatars/", "");
    const filepath = join(process.cwd(), "public", "uploads", "avatars", filename);
    
    const { access } = await import("fs/promises");
    try {
      await access(filepath);
      await unlink(filepath);
    } catch {
    }
    
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression de l'avatar:", error);
    return { success: true };
  }
}

