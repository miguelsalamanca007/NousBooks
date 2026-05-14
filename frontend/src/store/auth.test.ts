import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "./auth";

beforeEach(() => {
  useAuthStore.setState({ token: null, hasHydrated: false });
});

describe("useAuthStore", () => {
  it("starts with no token", () => {
    expect(useAuthStore.getState().token).toBeNull();
  });

  it("setToken stores the token", () => {
    useAuthStore.getState().setToken("jwt");
    expect(useAuthStore.getState().token).toBe("jwt");
  });

  it("logout clears the token", () => {
    useAuthStore.setState({ token: "jwt" });
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it("setHasHydrated flips the hydration flag", () => {
    expect(useAuthStore.getState().hasHydrated).toBe(false);
    useAuthStore.getState().setHasHydrated(true);
    expect(useAuthStore.getState().hasHydrated).toBe(true);
  });

  it("persists token to localStorage under nousbooks-auth", () => {
    useAuthStore.getState().setToken("persist-me");
    const raw = window.localStorage.getItem("nousbooks-auth");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).state.token).toBe("persist-me");
  });

  it("does not persist hasHydrated (partialize)", () => {
    useAuthStore.getState().setHasHydrated(true);
    useAuthStore.getState().setToken("t");
    const raw = window.localStorage.getItem("nousbooks-auth");
    const persisted = JSON.parse(raw!).state;
    expect(persisted.hasHydrated).toBeUndefined();
    expect(persisted.token).toBe("t");
  });
});
