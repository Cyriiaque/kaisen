"use client";

import { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Bell, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationsCount,
} from "@/app/(app)/notification-actions";
import { Button } from "@/components/ui/button";

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
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const result = await getNotifications();
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

  const handleMarkAsRead = async (notificationId: string) => {
    startTransition(async () => {
      const result = await markNotificationAsRead(notificationId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
      }
    });
  };

  const handleMarkAllAsRead = async () => {
    startTransition(async () => {
      const result = await markAllNotificationsAsRead();
      if (result?.error) {
        toast.error(result.error);
      } else {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.success("Toutes les notifications ont été marquées comme lues");
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
      const reminderTime = payload.reminderTime;
      
      if (reminderTime) {
        return `Rappel : ${habitName} dans 20 minutes (${reminderTime})`;
      }
      return `Rappel : ${habitName}`;
    }
    
    return "Nouvelle notification";
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
            className="fixed inset-0 bg-black/50 z-[100]"
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
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    disabled={isPending}
                    className="text-xs"
                  >
                    <CheckCheck className="w-4 h-4 mr-1" />
                    Tout marquer lu
                  </Button>
                )}
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
                    const isRead = notification.read;
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-xl p-4 border ${
                          isRead
                            ? "bg-muted/30 border-border"
                            : "bg-background border-purple-500/30 shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm ${
                                isRead
                                  ? "text-muted-foreground"
                                  : "text-foreground font-medium"
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
                          {!isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              disabled={isPending}
                              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                              title="Marquer comme lu"
                            >
                              <Check className="w-4 h-4 text-muted-foreground" />
                            </button>
                          )}
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

