"use server";

import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { revalidatePath } from "next/cache";

/**
 * Upload un fichier avatar et retourne le chemin relatif
 */
export async function uploadAvatar(formData: FormData) {
  const file = formData.get("avatar") as File | null;

  if (!file) {
    return { error: "Aucun fichier fourni" };
  }

  // Vérifier le type de fichier
  if (!file.type.startsWith("image/")) {
    return { error: "Le fichier doit être une image" };
  }

  // Vérifier la taille (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { error: "Le fichier est trop volumineux (max 5MB)" };
  }

  try {
    // Créer le dossier uploads/avatars s'il n'existe pas
    const uploadsDir = join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadsDir, { recursive: true });

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `${timestamp}-${randomString}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Convertir le fichier en buffer et l'écrire
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Retourner le chemin relatif pour l'URL
    const relativePath = `/uploads/avatars/${filename}`;

    revalidatePath("/profile");
    return { success: true, path: relativePath };
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    return { error: "Erreur lors de l'upload du fichier" };
  }
}

/**
 * Supprime un fichier avatar s'il existe dans le dossier uploads/avatars
 */
export async function deleteAvatar(avatarPath: string | null | undefined) {
  if (!avatarPath) {
    return { success: true };
  }

  // Ne supprimer que les fichiers dans notre dossier d'upload
  if (!avatarPath.startsWith("/uploads/avatars/")) {
    return { success: true };
  }

  try {
    const filename = avatarPath.replace("/uploads/avatars/", "");
    const filepath = join(process.cwd(), "public", "uploads", "avatars", filename);
    
    // Vérifier si le fichier existe avant de le supprimer
    const { access } = await import("fs/promises");
    try {
      await access(filepath);
      await unlink(filepath);
    } catch {
      // Le fichier n'existe pas, ce n'est pas grave
    }
    
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression de l'avatar:", error);
    // Ne pas faire échouer la mise à jour si la suppression échoue
    return { success: true };
  }
}

