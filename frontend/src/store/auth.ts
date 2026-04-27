import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  /** True once Zustand has finished rehydrating from localStorage. */
  hasHydrated: boolean;
  setToken: (token: string) => void;
  logout: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      hasHydrated: false,
      setToken: (token) => set({ token }),
      logout: () => set({ token: null }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "nousbooks-auth",
      // Only persist the token; hydration flag is runtime-only.
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        // Fires after the persisted state is merged in (or immediately on the
        // server with `state === undefined`). Mark hydration complete so the
        // app layout can decide whether to render or redirect.
        state?.setHasHydrated(true);
      },
    }
  )
);
