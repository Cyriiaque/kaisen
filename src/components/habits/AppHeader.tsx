"use client";

import { Logo } from "@/components/habits/Logo";
import { useEffect, useState } from "react";

export function AppHeader() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Détecter le thème initial
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setIsDark(isDarkMode);
    };

    // Vérifier au montage
    checkTheme();

    // Écouter les changements de thème
    const observer = new MutationObserver(() => {
      checkTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

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


