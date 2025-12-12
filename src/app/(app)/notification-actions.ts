"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { scheduleNotificationsForHabits } from "@/lib/notification-utils";

export async function getNotifications() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  return {
    notifications: notifications.map((notification) => ({
      ...notification,
      createdAt: notification.createdAt.toISOString(),
    })),
  };
}

export async function getNotificationsAndMarkAsRead() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  await prisma.notification.updateMany({
    where: {
      userId: user.id,
      read: false,
    },
    data: { read: true },
  });

  revalidatePath("/");
  
  return {
    notifications: notifications.map((notification) => ({
      ...notification,
      createdAt: notification.createdAt.toISOString(),
    })),
  };
}

export async function markNotificationAsRead(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== user.id) {
    return { error: "Notification introuvable" };
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });

  revalidatePath("/");
  return { success: true };
}

export async function deleteNotification(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== user.id) {
    return { error: "Notification introuvable" };
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });

  revalidatePath("/");
  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  try {
    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        read: false,
      },
      data: { read: true },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors du marquage des notifications:", error);
    return { error: "Erreur lors du marquage des notifications" };
  }
}

export async function getUnreadNotificationsCount() {
  const user = await getCurrentUser();
  if (!user) {
    return { count: 0 };
  }

  const count = await prisma.notification.count({
    where: {
      userId: user.id,
      read: false,
    },
  });

  return { count };
}

export async function tickNotifications() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Non authentifié" };
  }

  try {
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

    const notificationsCreated = await scheduleNotificationsForHabits(habits);

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false,
      },
    });

    revalidatePath("/");
    
    return {
      success: true,
      notificationsCreated: notificationsCreated.length,
      habits: notificationsCreated,
      unreadCount,
    };
  } catch (error) {
    console.error("Erreur lors du tick des notifications:", error);
    return { error: "Erreur lors du traitement des notifications" };
  }
}

export async function testScheduleNotifications() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Non authentifié" };
  }

  try {
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

    const notificationsCreated = await scheduleNotificationsForHabits(habits);

    revalidatePath("/");
    return { 
      success: true, 
      notificationsCreated: notificationsCreated.length,
      habits: notificationsCreated,
    };
  } catch (error) {
    console.error("Erreur lors du test de planification:", error);
    return { error: "Erreur lors de la planification des notifications" };
  }
}

