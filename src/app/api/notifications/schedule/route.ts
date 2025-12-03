import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Route API pour planifier les notifications des habitudes
 * Cette route peut être appelée par un cron job (Vercel Cron, etc.)
 * ou déclenchée manuellement
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification (optionnel : utiliser un secret)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const now = new Date();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Récupérer toutes les habitudes avec notifications activées
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

    const notificationsCreated: string[] = [];

    for (const habit of habits) {

      // Vérifier que l'habitude est active aujourd'hui
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = dimanche, 1 = lundi, etc.
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convertir en 0-6 (lundi-dimanche)

      let isActiveToday = false;
      if (habit.frequency === "DAILY") {
        isActiveToday = true;
      } else if (habit.frequency === "CUSTOM" && habit.activeDays) {
        const activeDays = JSON.parse(habit.activeDays) as number[];
        isActiveToday = activeDays.includes(adjustedDay);
      } else if (habit.frequency === "WEEKLY") {
        // Pour WEEKLY, on vérifie si l'habitude n'a pas encore été complétée cette semaine
        isActiveToday = true; // Simplification : on considère qu'elle est active
      }

      // Vérifier les dates de début et de fin
      if (habit.startDate && new Date(habit.startDate) > today) {
        continue;
      }
      if (habit.endDate && new Date(habit.endDate) < today) {
        continue;
      }

      // Vérifier si l'habitude n'est pas déjà complétée aujourd'hui
      const isCompletedToday = habit.logs.some((log) => log.done);
      if (isCompletedToday) {
        continue;
      }

      if (!isActiveToday) {
        continue;
      }

      // Vérifier si une notification n'a pas déjà été créée aujourd'hui
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

      if (existingNotification) {
        continue;
      }

      // Déterminer l'heure de notification
      let notificationTime: Date | null = null;
      let reminderTime: string | null = null;

      if (habit.reminders.length > 0) {
        // Si une heure est renseignée, envoyer 20 minutes avant
        const reminder = habit.reminders[0];
        reminderTime = reminder.atTime;
        const [hours, minutes] = reminder.atTime.split(":").map(Number);
        
        notificationTime = new Date(today);
        notificationTime.setHours(hours, minutes, 0, 0);
        
        // Soustraire 20 minutes
        notificationTime.setMinutes(notificationTime.getMinutes() - 20);
      } else {
        // Si pas d'heure, envoyer au début de la journée (8h00 par défaut)
        notificationTime = new Date(today);
        notificationTime.setHours(8, 0, 0, 0);
      }

      // Vérifier si c'est le moment d'envoyer la notification
      // On envoie si l'heure de notification est passée et qu'on est dans la même journée
      // On permet une fenêtre de 2 heures après l'heure de notification pour créer la notification
      // (au cas où le cron job s'exécute avec un peu de retard)
      const nowTime = new Date();
      const isNotificationTimePassed = notificationTime <= nowTime;
      const isSameDay = notificationTime.getDate() === nowTime.getDate() && 
                        notificationTime.getMonth() === nowTime.getMonth() &&
                        notificationTime.getFullYear() === nowTime.getFullYear();
      
      // Créer une fenêtre de temps : de l'heure de notification jusqu'à 2 heures après
      // (ou jusqu'à l'heure de l'habitude si elle est plus proche)
      let timeWindowEnd: Date;
      if (habit.reminders.length > 0) {
        const [hours, minutes] = reminderTime!.split(":").map(Number);
        const habitTime = new Date(today);
        habitTime.setHours(hours, minutes, 0, 0);
        // La fenêtre se termine à l'heure de l'habitude ou 2h après la notification, selon le plus proche
        const twoHoursAfterNotification = new Date(notificationTime);
        twoHoursAfterNotification.setHours(twoHoursAfterNotification.getHours() + 2);
        timeWindowEnd = habitTime < twoHoursAfterNotification ? habitTime : twoHoursAfterNotification;
      } else {
        // Pour les notifications sans heure, fenêtre de 2 heures après 8h00 (jusqu'à 10h00)
        timeWindowEnd = new Date(notificationTime);
        timeWindowEnd.setHours(timeWindowEnd.getHours() + 2);
      }
      
      const isWithinTimeWindow = nowTime <= timeWindowEnd && nowTime >= notificationTime;

      if (isNotificationTimePassed && isSameDay && isWithinTimeWindow) {
        // Créer la notification
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

