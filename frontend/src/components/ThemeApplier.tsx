"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/theme";

/**
 * Mounted once at the root of the app. Watches the persisted theme mode and
 * either follows the OS preference (`system`) or forces a fixed value on the
 * `<html>` element. Renders nothing.
 *
 * The class is `dark` so it pairs with the `dark:` Tailwind variant declared
 * in globals.css.
 */
export default function ThemeApplier() {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    const root = document.documentElement;

    function apply(isDark: boolean) {
      root.classList.toggle("dark", isDark);
    }

    if (mode === "dark") {
      apply(true);
      return;
    }
    if (mode === "light") {
      apply(false);
      return;
    }

    // mode === "system" — follow OS preference and react to changes
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    apply(media.matches);
    const listener = (e: MediaQueryListEvent) => apply(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [mode]);

  return null;
}
