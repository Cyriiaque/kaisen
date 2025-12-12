import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scheduleNotificationsForHabits } from "@/lib/notification-utils";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const now = new Date();
    
    const habits = await prisma.habit.findMany({
      where: {
        notificationsEnabled: true,
      },
      include: {
        reminders: true,
        logs: {
          where: {
            date: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
              lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
            },
          },
        },
      },
    });

    const notificationsCreated = await scheduleNotificationsForHabits(habits);

    return NextResponse.json({
      success: true,
      notificationsCreated: notificationsCreated.length,
      habits: notificationsCreated,
    });
  } catch (error) {
    console.error("Erreur lors de la planification des notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de la planification des notifications" },
      { status: 500 }
    );
  }
}

