"use client";

import { Logo } from "@/components/habits/Logo";
import { useEffect, useState } from "react";

interface AppHeaderProps {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

export function AppHeader({ user }: AppHeaderProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("kaisen_theme");
    if (savedTheme === "dark") {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.localStorage.setItem("kaisen_theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <div className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border z-40 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo isDark={isDark} />
          <div>
            <h1 className="text-foreground">Kaisen</h1>
          </div>
        </div>
      </div>
    </div>
  );
}


