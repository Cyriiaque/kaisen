"use client";

import { useEffect } from "react";

interface ThemeProviderProps {
  theme?: string | null;
}

export function ThemeProvider({ theme }: ThemeProviderProps) {
  useEffect(() => {
    if (theme) {
      const isDark = theme === "dark";
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      window.localStorage.setItem("kaisen_theme", theme);
    }
  }, [theme]);

  return null;
}

