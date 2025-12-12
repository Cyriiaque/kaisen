"use client";

import { Logo } from "@/components/habits/Logo";
import { useEffect, useState, useTransition, useCallback } from "react";
import { Bell } from "lucide-react";
import { NotificationsOverlay } from "@/components/habits/NotificationsOverlay";
import { getUnreadNotificationsCount, tickNotifications } from "@/app/(app)/notification-actions";

export function AppHeader() {
  const [isDark, setIsDark] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  const loadUnreadCount = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await getUnreadNotificationsCount();
        if (result.count !== undefined) {
          setUnreadCount(result.count);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du compteur:", error);
      }
    });
  }, [startTransition]);

  const tickNotificationsHandler = useCallback(async () => {
    startTransition(async () => {
      try {
        const result = await tickNotifications();
        if ("error" in result) {
          loadUnreadCount();
          return;
        }
        if (result.unreadCount !== undefined) {
          setUnreadCount(result.unreadCount);
        }
      } catch (error) {
        console.error("[AppHeader] Erreur lors du tick:", error);
        loadUnreadCount();
      }
    });
  }, [startTransition, loadUnreadCount]);

  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setIsDark(isDarkMode);
    };

    checkTheme();

    const observer = new MutationObserver(() => {
      checkTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    tickNotificationsHandler();

    const interval = setInterval(() => {
      tickNotificationsHandler();
    }, 60000);

    return () => clearInterval(interval);
  }, [tickNotificationsHandler]);


  const handleNotificationsClick = () => {
    setIsNotificationsOpen(true);
  };

  return (
    <>
    <div className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border z-40 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo isDark={isDark} />
          <div>
            <h1 className="text-foreground">Kaisen</h1>
          </div>
        </div>
          <button
            onClick={handleNotificationsClick}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-kaisen-gradient-primary text-kaisen-on-primary text-xs rounded-full flex items-center justify-center font-semibold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
      </div>
    </div>
      <NotificationsOverlay
        isOpen={isNotificationsOpen}
        onClose={() => {
          setIsNotificationsOpen(false);
          loadUnreadCount();
        }}
      />
    </>
  );
}


