import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

/**
 * Persisted user preference for the colour scheme. The actual `<html>` class
 * mutation lives in <ThemeApplier>, which subscribes to this store and to
 * the OS preference (prefers-color-scheme) when the user picks "system".
 *
 * We keep the store minimal — just the user's intent — so other components
 * can read or change it without re-running side effects.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "system",
      setMode: (mode) => set({ mode }),
    }),
    { name: "nousbooks-theme" }
  )
);
