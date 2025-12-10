"use client";

import { useEffect, useState } from "react";

interface LogoProps {
  className?: string;
  isDark?: boolean;
}

export function Logo({ className = "", isDark }: LogoProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDark !== undefined) {
      setIsDarkMode(isDark);
      return;
    }

    const checkTheme = () => {
      const dark = document.documentElement.classList.contains("dark");
      setIsDarkMode(dark);
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
  }, [isDark]);

  const fillColor = isDarkMode ? "#FFFFFF" : "#000000";

  return (
    <svg
      width="36"
      height="28.8"
      viewBox="0 0 120 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="15" y="60" width="12" height="16" rx="2" fill={fillColor} opacity="0.6" />
      <rect x="32" y="48" width="12" height="28" rx="2" fill={fillColor} opacity="0.8" />
      <rect x="49" y="20" width="12" height="56" rx="2" fill={fillColor} />
      <path
        d="M 55 48 L 80 24 M 55 48 L 80 72"
        stroke={fillColor}
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}



