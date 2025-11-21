import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/auth-actions";
import { prisma } from "@/lib/prisma";
import { StatsView } from "@/components/habits/StatsView";

function StatsSkeleton() {
  return (
    <div className="pb-24 space-y-6">
      <div className="h-10 w-32 rounded-full bg-muted animate-pulse" />
      <div className="h-32 rounded-3xl bg-muted animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-2xl bg-muted animate-pulse" />
        <div className="h-24 rounded-2xl bg-muted animate-pulse" />
        <div className="h-24 rounded-2xl bg-muted animate-pulse" />
        <div className="h-24 rounded-2xl bg-muted animate-pulse" />
      </div>
      <div className="h-56 rounded-2xl bg-muted animate-pulse" />
    </div>
  );
}

export default function StatsPage() {
  return (
    <Suspense fallback={<StatsSkeleton />}>
      <StatsContent />
    </Suspense>
  );
}

async function StatsContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const habits = await prisma.habit.findMany({
    where: { userId: user.id },
    include: {
      category: true,
      logs: {
        where: {
          done: true,
        },
        select: {
          date: true,
        },
      },
    },
  });

  const habitsWithLogs = habits.map((habit: (typeof habits)[number]) => {
    const completedDates = habit.logs.map((log: { date: Date }) =>
      log.date.toISOString().split("T")[0],
    );

    let streak = 0;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setUTCDate(checkDate.getUTCDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];

      if (completedDates.includes(dateStr)) {
        streak++;
      } else {
        break;
      }
    }

    return {
      id: habit.id,
      name: habit.name,
      description: habit.description || undefined,
      color: habit.color,
      category: habit.category?.name || "Autre",
      categoryColor: habit.category?.color || "purple",
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
      streak,
      completedDates,
      createdAt: habit.createdAt.toISOString(),
    };
  });

  return <StatsView habits={habitsWithLogs} />;
}


