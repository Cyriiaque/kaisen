"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/auth-actions";

const HabitSchema = z.object({
  name: z.string().min(1, "Le nom de l'habitude est requis"),
  description: z.string().optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "CUSTOM"]),
  activeDays: z.string().optional(), // JSON array string
  categoryName: z.string().optional(),
  time: z.string().optional(), // HH:mm format
  duration: z.string().optional(), // Durée de l'habitude
  notificationsEnabled: z.string().optional(), // "true" | "false"
  startDate: z.string().optional(), // Date de début (YYYY-MM-DD)
  endDate: z.string().optional(), // Date de fin (YYYY-MM-DD)
});

export async function createHabit(_: unknown, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const parsed = HabitSchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? undefined,
    frequency: formData.get("frequency")?.toString() ?? "DAILY",
    activeDays: formData.get("activeDays")?.toString() ?? undefined,
    categoryName: formData.get("categoryName")?.toString() ?? undefined,
    time: formData.get("time")?.toString() ?? undefined,
    duration: formData.get("duration")?.toString() ?? undefined,
    notificationsEnabled: formData.get("notificationsEnabled")?.toString() ?? undefined,
    startDate: formData.get("startDate")?.toString() ?? undefined,
    endDate: formData.get("endDate")?.toString() ?? undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Données invalides",
    };
  }

  const {
    name,
    description,
    frequency,
    activeDays,
    categoryName,
    time,
    duration,
    notificationsEnabled,
    startDate,
    endDate,
  } = parsed.data;

  // Gérer les jours actifs :
  // - DAILY : tous les jours (0-6)
  // - WEEKLY : une fois par semaine, pas de jours spécifiques
  // - CUSTOM : jours personnalisés obligatoires
  let finalActiveDays: string | null = null;
  if (frequency === "DAILY") {
    finalActiveDays = JSON.stringify([0, 1, 2, 3, 4, 5, 6]);
  } else if (frequency === "WEEKLY") {
    finalActiveDays = null;
  } else if (activeDays && activeDays.trim() !== "") {
    // Valider que activeDays est un JSON valide
    try {
      const parsedDays = JSON.parse(activeDays);
      if (Array.isArray(parsedDays) && parsedDays.length > 0) {
        finalActiveDays = activeDays;
      } else {
        return { error: "Au moins un jour doit être sélectionné pour une fréquence personnalisée" };
      }
    } catch {
      return { error: "Format des jours actifs invalide" };
    }
  } else {
    // Si c'est CUSTOM et qu'aucun activeDays n'est fourni
    return { error: "Au moins un jour doit être sélectionné pour une fréquence personnalisée" };
  }

  // Calculer les dates de début et de fin
  // Le format reçu est YYYY-MM-DD, on doit créer une Date à minuit UTC
  const startDateValue =
    startDate && startDate.trim() !== ""
      ? new Date(startDate + "T00:00:00.000Z")
      : null;
  const endDateValue =
    endDate && endDate.trim() !== ""
      ? new Date(endDate + "T00:00:00.000Z")
      : null;

  // Créer ou récupérer la catégorie si fournie et en déduire la couleur
  let categoryId: string | null = null;
  let color = "purple";
  if (categoryName && categoryName.trim() !== "") {
    const existingCategory = await prisma.category.findUnique({
      where: { 
        userId_name: {
          userId: user.id,
          name: categoryName,
        },
      },
    });

    if (existingCategory) {
      categoryId = existingCategory.id;
      color = existingCategory.color;
    } else {
      const newCategory = await prisma.category.create({
        data: {
          name: categoryName,
          userId: user.id,
          color, // couleur par défaut, modifiable dans la page de gestion des catégories
        },
      });
      categoryId = newCategory.id;
      color = newCategory.color;
    }
  }

  const createdHabit = await prisma.habit.create({
    data: {
      userId: user.id,
      name,
      description: description || null,
      color,
      frequency,
      activeDays: finalActiveDays,
      categoryId,
      duration: duration || null,
      notificationsEnabled: notificationsEnabled === "true",
      startDate: startDateValue,
      endDate: endDateValue,
    },
  });

  // Créer un Reminder si une heure est fournie
  if (time && time.trim() !== "") {
    // Récupérer le timezone de l'utilisateur (par défaut, on utilise le timezone du système)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await prisma.reminder.create({
      data: {
        habitId: createdHabit.id,
        atTime: time,
        timezone,
      },
    });
  }

  revalidatePath("/");
  return { success: true };
}

export async function updateHabit(
  id: string,
  _: unknown,
  formData: FormData,
) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const habit = await prisma.habit.findUnique({
    where: { id },
  });

  if (!habit || habit.userId !== user.id) {
    return { error: "Habitude introuvable" };
  }

  const parsed = HabitSchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? undefined,
    frequency: formData.get("frequency")?.toString() ?? "DAILY",
    activeDays: formData.get("activeDays")?.toString() ?? undefined,
    categoryName: formData.get("categoryName")?.toString() ?? undefined,
    time: formData.get("time")?.toString() ?? undefined,
    duration: formData.get("duration")?.toString() ?? undefined,
    notificationsEnabled: formData.get("notificationsEnabled")?.toString() ?? undefined,
    startDate: formData.get("startDate")?.toString() ?? undefined,
    endDate: formData.get("endDate")?.toString() ?? undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Données invalides",
    };
  }

  const {
    name,
    description,
    frequency,
    activeDays,
    categoryName,
    time,
    duration,
    notificationsEnabled,
    startDate,
    endDate,
  } = parsed.data;

  // Gérer les jours actifs :
  // - DAILY : tous les jours (0-6)
  // - WEEKLY : une fois par semaine, pas de jours spécifiques
  // - CUSTOM : jours personnalisés obligatoires
  let finalActiveDays: string | null = null;
  if (frequency === "DAILY") {
    finalActiveDays = JSON.stringify([0, 1, 2, 3, 4, 5, 6]);
  } else if (frequency === "WEEKLY") {
    finalActiveDays = null;
  } else if (activeDays && activeDays.trim() !== "") {
    // Valider que activeDays est un JSON valide
    try {
      const parsedDays = JSON.parse(activeDays);
      if (Array.isArray(parsedDays) && parsedDays.length > 0) {
        finalActiveDays = activeDays;
      } else {
        return { error: "Au moins un jour doit être sélectionné pour une fréquence personnalisée" };
      }
    } catch {
      return { error: "Format des jours actifs invalide" };
    }
  } else {
    // Si c'est CUSTOM et qu'aucun activeDays n'est fourni
    return { error: "Au moins un jour doit être sélectionné pour une fréquence personnalisée" };
  }

  // Calculer les dates de début et de fin
  // Le format reçu est YYYY-MM-DD, on doit créer une Date à minuit UTC
  const startDateValue =
    startDate && startDate.trim() !== ""
      ? new Date(startDate + "T00:00:00.000Z")
      : null;
  const endDateValue =
    endDate && endDate.trim() !== ""
      ? new Date(endDate + "T00:00:00.000Z")
      : null;

  // Créer ou récupérer la catégorie si fournie et en déduire la couleur
  let categoryId: string | null = habit.categoryId;
  let color = habit.color;
  if (categoryName && categoryName.trim() !== "") {
    const existingCategory = await prisma.category.findUnique({
      where: { 
        userId_name: {
          userId: user.id,
          name: categoryName,
        },
      },
    });

    if (existingCategory) {
      categoryId = existingCategory.id;
      color = existingCategory.color;
    } else {
      const newCategory = await prisma.category.create({
        data: {
          name: categoryName,
          userId: user.id,
          color,
        },
      });
      categoryId = newCategory.id;
      color = newCategory.color;
    }
  }

  await prisma.habit.update({
    where: { id },
    data: {
      name,
      description: description || null,
      color,
      frequency,
      activeDays: finalActiveDays,
      categoryId,
      duration: duration || null,
      notificationsEnabled: notificationsEnabled === "true",
      startDate: startDateValue,
      endDate: endDateValue,
    },
  });

  // Gérer les reminders : supprimer les anciens et créer un nouveau si une heure est fournie
  await prisma.reminder.deleteMany({
    where: { habitId: id },
  });

  if (time && time.trim() !== "") {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await prisma.reminder.create({
      data: {
        habitId: id,
        atTime: time,
        timezone,
      },
    });
  }

  revalidatePath("/");
  revalidatePath(`/habits/${id}`);
  return { success: true };
}

export async function deleteHabit(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const habit = await prisma.habit.findUnique({
    where: { id },
  });

  if (!habit || habit.userId !== user.id) {
    return { error: "Habitude introuvable" };
  }

  await prisma.habit.delete({
    where: { id },
  });

  revalidatePath("/");
  return { success: true };
}

export async function toggleHabitLog(habitId: string, date: Date) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const habit = await prisma.habit.findUnique({
    where: { id: habitId },
  });

  if (!habit || habit.userId !== user.id) {
    return { error: "Habitude introuvable" };
  }

  // Normaliser la date à minuit UTC
  const dateAtMidnight = new Date(date);
  dateAtMidnight.setUTCHours(0, 0, 0, 0);

  const existingLog = await prisma.habitLog.findUnique({
    where: {
      habitId_date: {
        habitId,
        date: dateAtMidnight,
      },
    },
  });

  if (existingLog) {
    if (existingLog.done) {
      await prisma.habitLog.delete({
        where: { id: existingLog.id },
      });
    } else {
      await prisma.habitLog.update({
        where: { id: existingLog.id },
        data: { done: true },
      });
    }
  } else {
    await prisma.habitLog.create({
      data: {
        habitId,
        date: dateAtMidnight,
        done: true,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/stats");
  revalidatePath("/calendar");
  return { success: true };
}


