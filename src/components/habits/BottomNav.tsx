"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListChecks, BarChart3, Calendar, User } from "lucide-react";

type TabId = "home" | "habits" | "stats" | "calendar" | "profile";

const tabs: Array<{ id: TabId; icon: typeof Home; label: string; href: string }> = [
  { id: "home", icon: Home, label: "Accueil", href: "/" },
  { id: "habits", icon: ListChecks, label: "Habitudes", href: "/habits" },
  { id: "calendar", icon: Calendar, label: "Calendrier", href: "/calendar" },
  { id: "stats", icon: BarChart3, label: "Stats", href: "/stats" },
  { id: "profile", icon: User, label: "Profil", href: "/profile" },
];

function tabFromPath(pathname: string | null): TabId {
  const path = pathname ?? "/";
  if (path.startsWith("/habits")) return "habits";
  if (path.startsWith("/calendar")) return "calendar";
  if (path.startsWith("/stats")) return "stats";
  if (path.startsWith("/profile")) return "profile";
  return "home";
}

export function BottomNav() {
  const pathname = usePathname();
  const activeTab = tabFromPath(pathname);

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border z-50"
    >
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className="relative flex flex-col items-center gap-1 py-2 px-2 transition-colors flex-1"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-kaisen-gradient-primary-br rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon
                  className={`w-6 h-6 relative z-10 ${
                    isActive ? "text-kaisen-on-primary" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-xs relative z-10 ${
                    isActive ? "text-kaisen-on-primary" : "text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}


