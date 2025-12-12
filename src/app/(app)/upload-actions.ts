"use server";

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
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";
    
    const maxBase64Size = 500 * 1024;
    if (base64.length > maxBase64Size) {
      return { 
        error: "L'image est trop volumineuse. Veuillez utiliser une image plus petite (max ~375KB)" 
      };
    }
    
    const dataUrl = `data:${mimeType};base64,${base64}`;

    revalidatePath("/profile");
    return { success: true, path: dataUrl };
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    return { error: "Erreur lors de l'upload du fichier" };
  }
}

export async function deleteAvatar(avatarPath: string | null | undefined) {
  return { success: true };
}

