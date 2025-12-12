import { prisma } from "@/lib/prisma";
import { getTimezoneOffsetInMinutes } from "@/lib/date-utils";

type HabitWithRelations = {
  id: string;
  userId: string;
  name: string;
  frequency: string;
  activeDays: string | null;
  startDate: Date | null;
  endDate: Date | null;
  reminders: Array<{
    atTime: string;
    timezone: string | null;
  }>;
  logs: Array<{
    done: boolean;
  }>;
};

export async function scheduleNotificationsForHabits(
  habits: HabitWithRelations[],
  userId?: string | null
): Promise<string[]> {
  const notificationsCreated: string[] = [];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const todayDateOnly = new Date(today);
  todayDateOnly.setHours(0, 0, 0, 0);
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  const nowTime = new Date();

  for (const habit of habits) {
    let isActiveToday = false;
    if (habit.frequency === "DAILY") {
      isActiveToday = true;
    } else if (habit.frequency === "CUSTOM" && habit.activeDays) {
      const activeDays = JSON.parse(habit.activeDays) as number[];
      isActiveToday = activeDays.includes(adjustedDay);
    } else if (habit.frequency === "WEEKLY") {
      isActiveToday = true;
    }

    if (habit.startDate) {
      const startDateOnly = new Date(habit.startDate);
      startDateOnly.setHours(0, 0, 0, 0);
      if (startDateOnly > todayDateOnly) continue;
    }

    if (habit.endDate) {
      const endDateOnly = new Date(habit.endDate);
      endDateOnly.setHours(23, 59, 59, 999);
      if (endDateOnly < todayDateOnly) continue;
    }

    if (habit.logs.some((log) => log.done)) continue;
    if (!isActiveToday) continue;

    const targetUserId = userId || habit.userId;
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: targetUserId,
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
      const timeZone = reminder.timezone || "Europe/Paris";
      const offsetMinutes = getTimezoneOffsetInMinutes(today, timeZone);

      notificationTime = new Date(today);
      notificationTime.setUTCHours(hours, minutes, 0, 0);
      notificationTime.setUTCMinutes(
        notificationTime.getUTCMinutes() - offsetMinutes - 20
      );
    } else {
      const timeZone = "Europe/Paris";
      const offsetMinutes = getTimezoneOffsetInMinutes(today, timeZone);

      notificationTime = new Date(today);
      notificationTime.setUTCHours(8, 0, 0, 0);
      notificationTime.setUTCMinutes(
        notificationTime.getUTCMinutes() - offsetMinutes
      );
    }

    const isNotificationTimePassed = notificationTime <= nowTime;
    const isSameDay =
      notificationTime.getDate() === nowTime.getDate() &&
      notificationTime.getMonth() === nowTime.getMonth() &&
      notificationTime.getFullYear() === nowTime.getFullYear();

    let timeWindowEnd: Date;
    if (habit.reminders.length > 0) {
      const [hours, minutes] = reminderTime!.split(":").map(Number);
      const reminder = habit.reminders[0];
      const timeZone = reminder.timezone || "Europe/Paris";
      const offsetMinutes = getTimezoneOffsetInMinutes(today, timeZone);

      const habitTime = new Date(today);
      habitTime.setUTCHours(hours, minutes, 0, 0);
      habitTime.setUTCMinutes(habitTime.getUTCMinutes() - offsetMinutes);

      const twoHoursAfterNotification = new Date(notificationTime);
      twoHoursAfterNotification.setHours(
        twoHoursAfterNotification.getHours() + 2
      );
      timeWindowEnd =
        habitTime < twoHoursAfterNotification
          ? habitTime
          : twoHoursAfterNotification;
    } else {
      timeWindowEnd = new Date(notificationTime);
      timeWindowEnd.setHours(timeWindowEnd.getHours() + 2);
    }

    const isWithinTimeWindow =
      nowTime <= timeWindowEnd && nowTime >= notificationTime;

    if (isNotificationTimePassed && isSameDay && isWithinTimeWindow) {
      const reminder = habit.reminders[0];
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          type: "reminder",
          payload: JSON.stringify({
            habitId: habit.id,
            habitName: habit.name,
            reminderTime,
            timezone: reminder?.timezone,
          }),
          read: false,
        },
      });

      notificationsCreated.push(habit.id);
    }
  }

  return notificationsCreated;
}

