"use client";

import { Logo } from "@/components/habits/Logo";
import { useEffect, useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { NotificationsOverlay } from "@/components/habits/NotificationsOverlay";
import { getUnreadNotificationsCount } from "@/app/(app)/notification-actions";

export function AppHeader() {
  const [isDark, setIsDark] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPending, startTransition] = useTransition();

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
    tickNotifications();

    const interval = setInterval(tickNotifications, 60000);

    return () => clearInterval(interval);
  }, []);

  const tickNotifications = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.unreadCount !== undefined) {
          setUnreadCount(data.unreadCount);
        }
        if (data.notificationsCreated > 0) {
          console.log("[AppHeader] Notifications créées:", data.notificationsCreated);
        }
      } else {
        loadUnreadCount();
      }
    } catch (error) {
      console.error("[AppHeader] Erreur lors du tick:", error);
      loadUnreadCount();
    }
  };

  const loadUnreadCount = () => {
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
  };

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


