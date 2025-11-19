"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/auth-actions";

const HabitSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string(),
  frequency: z.enum(["DAILY", "WEEKLY", "CUSTOM"]),
  activeDays: z.string().optional(), // JSON array string
  categoryId: z.string().optional(),
});

export async function createHabit(_: unknown, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const parsed = HabitSchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? undefined,
    color: formData.get("color")?.toString() ?? "purple",
    frequency: formData.get("frequency")?.toString() ?? "DAILY",
    activeDays: formData.get("activeDays")?.toString() ?? undefined,
    categoryId: formData.get("categoryId")?.toString() ?? undefined,
  });

  if (!parsed.success) {
    return { error: "Invalid form data" };
  }

  const { name, description, color, frequency, activeDays, categoryId } =
    parsed.data;

  await prisma.habit.create({
    data: {
      userId: user.id,
      name,
      description,
      color,
      frequency,
      activeDays,
      categoryId: categoryId || null,
    },
  });

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
    return { error: "Habit not found" };
  }

  const parsed = HabitSchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? undefined,
    color: formData.get("color")?.toString() ?? "purple",
    frequency: formData.get("frequency")?.toString() ?? "DAILY",
    activeDays: formData.get("activeDays")?.toString() ?? undefined,
    categoryId: formData.get("categoryId")?.toString() ?? undefined,
  });

  if (!parsed.success) {
    return { error: "Invalid form data" };
  }

  const { name, description, color, frequency, activeDays, categoryId } =
    parsed.data;

  await prisma.habit.update({
    where: { id },
    data: {
      name,
      description,
      color,
      frequency,
      activeDays,
      categoryId: categoryId || null,
    },
  });

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
    return { error: "Habit not found" };
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
    return { error: "Habit not found" };
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


