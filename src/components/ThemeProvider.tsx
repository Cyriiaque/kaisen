"use client";

import { useEffect } from "react";

interface ThemeProviderProps {
  theme?: string | null;
}

export function ThemeProvider({ theme }: ThemeProviderProps) {
  useEffect(() => {
    // Synchroniser le thème de la DB avec localStorage et le DOM
    if (theme) {
      const isDark = theme === "dark";
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      // Synchroniser avec localStorage pour les pages non authentifiées
      window.localStorage.setItem("kaisen_theme", theme);
    }
  }, [theme]);

  return null;
}

