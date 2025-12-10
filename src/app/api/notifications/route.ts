import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/auth-actions";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const now = new Date();
    
    const habits = await prisma.habit.findMany({
      where: {
        userId: user.id,
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

    const notificationsCreated: string[] = [];

    for (const habit of habits) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      let isActiveToday = false;
      if (habit.frequency === "DAILY") {
        isActiveToday = true;
      } else if (habit.frequency === "CUSTOM" && habit.activeDays) {
        const activeDays = JSON.parse(habit.activeDays) as number[];
        isActiveToday = activeDays.includes(adjustedDay);
      } else if (habit.frequency === "WEEKLY") {
        isActiveToday = true;
      }

      if (habit.startDate && new Date(habit.startDate) > today) continue;
      if (habit.endDate && new Date(habit.endDate) < today) continue;
      if (habit.logs.some((log) => log.done)) continue;
      if (!isActiveToday) continue;

      const todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: habit.userId,
          type: "reminder",
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
          payload: {
            contains: habit.id,
          },
        },
      });

      if (existingNotification) continue;

      let notificationTime: Date | null = null;
      let reminderTime: string | null = null;

      if (habit.reminders.length > 0) {
        const reminder = habit.reminders[0];
        reminderTime = reminder.atTime;
        const [hours, minutes] = reminder.atTime.split(":").map(Number);
        
        notificationTime = new Date(today);
        notificationTime.setHours(hours, minutes, 0, 0);
        notificationTime.setMinutes(notificationTime.getMinutes() - 20);
      } else {
        notificationTime = new Date(today);
        notificationTime.setHours(8, 0, 0, 0);
      }

      const nowTime = new Date();
      const isNotificationTimePassed = notificationTime <= nowTime;
      const isSameDay = notificationTime.getDate() === nowTime.getDate() && 
                        notificationTime.getMonth() === nowTime.getMonth() &&
                        notificationTime.getFullYear() === nowTime.getFullYear();
      
      let timeWindowEnd: Date;
      if (habit.reminders.length > 0) {
        const [hours, minutes] = reminderTime!.split(":").map(Number);
        const habitTime = new Date(today);
        habitTime.setHours(hours, minutes, 0, 0);
        const twoHoursAfterNotification = new Date(notificationTime);
        twoHoursAfterNotification.setHours(twoHoursAfterNotification.getHours() + 2);
        timeWindowEnd = habitTime < twoHoursAfterNotification ? habitTime : twoHoursAfterNotification;
      } else {
        timeWindowEnd = new Date(notificationTime);
        timeWindowEnd.setHours(timeWindowEnd.getHours() + 2);
      }
      
      const isWithinTimeWindow = nowTime <= timeWindowEnd && nowTime >= notificationTime;

      if (isNotificationTimePassed && isSameDay && isWithinTimeWindow) {
        await prisma.notification.create({
          data: {
            userId: habit.userId,
            type: "reminder",
            payload: JSON.stringify({
              habitId: habit.id,
              habitName: habit.name,
              reminderTime: reminderTime,
            }),
            read: false,
          },
        });

        notificationsCreated.push(habit.id);
      }
    }

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false,
      },
    });

    return NextResponse.json({
      success: true,
      notificationsCreated: notificationsCreated.length,
      habits: notificationsCreated,
      unreadCount,
    });
  } catch (error) {
    console.error("Erreur lors du tick des notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement des notifications" },
      { status: 500 }
    );
  }
}

