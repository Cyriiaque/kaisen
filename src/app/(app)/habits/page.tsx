import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/auth-actions";
import { prisma } from "@/lib/prisma";
import { HabitsManagement } from "@/components/habits/HabitsManagement";

function HabitsManagementSkeleton() {
  return (
    <div className="pb-24 space-y-4">
      <div className="h-10 w-40 rounded-full bg-muted animate-pulse" />
      <div className="h-32 rounded-2xl bg-muted animate-pulse" />
      <div className="h-40 rounded-2xl bg-muted animate-pulse" />
    </div>
  );
}

export default function HabitsPage() {
  return (
    <Suspense fallback={<HabitsManagementSkeleton />}>
      <HabitsContent />
    </Suspense>
  );
}

async function HabitsContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [categories, habits] = await Promise.all([
    prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
    prisma.habit.findMany({
      where: { userId: user.id },
      include: {
        category: true,
        reminders: {
          take: 1,
          orderBy: { id: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <HabitsManagement
      categories={categories}
      habits={habits.map((habit) => ({
        id: habit.id,
        name: habit.name,
        description: habit.description || undefined,
        color: habit.color,
        category: habit.category?.name || "Autre",
        createdAt: habit.createdAt.toISOString(),
        startDate: (habit as any).startDate
          ? (habit as any).startDate.toISOString()
          : undefined,
        endDate: (habit as any).endDate
          ? (habit as any).endDate.toISOString()
          : undefined,
        frequency: (
          habit.frequency === "DAILY"
            ? "daily"
            : habit.frequency === "WEEKLY"
            ? "weekly"
            : "custom"
        ) as "daily" | "weekly" | "custom",
        activeDays: habit.activeDays
          ? JSON.parse(habit.activeDays)
          : undefined,
        duration: habit.duration || undefined,
        reminderTime: habit.reminders[0]?.atTime || undefined,
      }))}
    />
  );
}


