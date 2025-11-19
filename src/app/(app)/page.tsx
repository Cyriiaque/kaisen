import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/auth-actions";
import { prisma } from "@/lib/prisma";
import { Dashboard } from "@/components/habits/Dashboard";

function DashboardSkeleton() {
  return (
    <div className="pb-24 space-y-6">
      <div className="rounded-3xl bg-muted animate-pulse h-40" />
      <div className="h-10 rounded-2xl bg-muted animate-pulse" />
      <div className="flex gap-2">
        <div className="h-9 w-20 rounded-xl bg-muted animate-pulse" />
        <div className="h-9 w-20 rounded-xl bg-muted animate-pulse" />
        <div className="h-9 w-24 rounded-xl bg-muted animate-pulse" />
      </div>
      <div className="space-y-3">
        <div className="h-20 rounded-2xl bg-muted animate-pulse" />
        <div className="h-20 rounded-2xl bg-muted animate-pulse" />
        <div className="h-20 rounded-2xl bg-muted animate-pulse" />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
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
    orderBy: { createdAt: "desc" },
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

  return <Dashboard habits={habitsWithLogs} />;
}


