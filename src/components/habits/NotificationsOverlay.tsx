"use client";

import { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Bell } from "lucide-react";
import { toast } from "sonner";

import {
  getNotificationsAndMarkAsRead,
  deleteNotification,
  getUnreadNotificationsCount,
} from "@/app/(app)/notification-actions";

interface Notification {
  id: string;
  type: string;
  payload: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsOverlay({
  isOpen,
  onClose,
}: NotificationsOverlayProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadNotificationsAndMarkAsRead();
    }
  }, [isOpen]);

  const loadNotificationsAndMarkAsRead = async () => {
    setIsLoading(true);
    try {
      const result = await getNotificationsAndMarkAsRead();
      if (result.notifications) {
        setNotifications(result.notifications);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error);
      toast.error("Erreur lors du chargement des notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    startTransition(async () => {
      const result = await deleteNotification(notificationId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== notificationId)
        );
      }
    });
  };

  const parsePayload = (payload: string) => {
    try {
      return JSON.parse(payload);
    } catch {
      return {};
    }
  };

  const formatNotificationMessage = (notification: Notification) => {
    const payload = parsePayload(notification.payload);
    
    if (notification.type === "reminder") {
      const habitName = payload.habitName || "une habitude";
      const reminderTime = payload.reminderTime as string | undefined;
      const timezone =
        (payload.timezone as string | undefined) ||
        "Europe/Paris";
      
      if (reminderTime) {
        const createdUtc = new Date(notification.createdAt);

        const formatter = new Intl.DateTimeFormat("en-CA", {
          timeZone: timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        const parts = formatter.formatToParts(createdUtc);
        const getPart = (type: string) =>
          parseInt(parts.find((p) => p.type === type)?.value || "0", 10);

        const year = getPart("year");
        const month = getPart("month");
        const day = getPart("day");
        const hour = getPart("hour");
        const minute = getPart("minute");

        const createdLocal = new Date(
          Date.UTC(year, month - 1, day, hour, minute, 0, 0)
        );

        const [remHours, remMinutes] = reminderTime.split(":").map(Number);
        let reminderLocal = new Date(
          Date.UTC(year, month - 1, day, remHours, remMinutes, 0, 0)
        );

        if (reminderLocal <= createdLocal) {
          reminderLocal.setUTCDate(reminderLocal.getUTCDate() + 1);
        }

        const diffMs = reminderLocal.getTime() - createdLocal.getTime();
        const diffMinutes = Math.ceil(diffMs / (1000 * 60));

        let timeText = "";
        if (diffMinutes <= 0) {
          timeText = "maintenant";
        } else if (diffMinutes < 60) {
          timeText = `dans ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
        } else {
          const hours = Math.floor(diffMinutes / 60);
          const mins = diffMinutes % 60;
          if (mins === 0) {
            timeText = `dans ${hours} heure${hours > 1 ? "s" : ""}`;
          } else {
            timeText = `dans ${hours}h${mins.toString().padStart(2, "0")}`;
          }
        }
        
        return `Rappel : ${habitName} ${timeText} (${reminderTime})`;
      }
      return `Rappel : ${habitName}`;
    }
    
    return "Nouvelle notification";
  };

  const isRecentNotification = (notification: Notification) => {
    return !notification.read;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-kaisen-overlay z-[100]"
          />
          
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-background shadow-xl z-[101] flex flex-col"
          >
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-foreground" />
                <h2 className="text-foreground font-semibold">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="bg-kaisen-gradient-primary text-kaisen-on-primary text-xs px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Chargement...</div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Aucune notification
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => {
                    const payload = parsePayload(notification.payload);
                    const isRecent = isRecentNotification(notification);
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-xl p-4 border ${
                          isRecent
                            ? "bg-kaisen-gradient-primary/10 border-purple-500/60 shadow-sm"
                            : "bg-muted/30 border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm ${
                                isRecent
                                  ? "text-foreground font-semibold"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {formatNotificationMessage(notification)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.createdAt).toLocaleString(
                                "fr-FR",
                                {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              handleDeleteNotification(notification.id)
                            }
                            disabled={isPending}
                            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                            title="Supprimer la notification"
                          >
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

