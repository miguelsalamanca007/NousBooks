import { beforeEach, describe, expect, it } from "vitest";
import { useThemeStore } from "./theme";

beforeEach(() => {
  useThemeStore.setState({ mode: "system" });
});

describe("useThemeStore", () => {
  it("defaults to system", () => {
    expect(useThemeStore.getState().mode).toBe("system");
  });

  it("setMode updates the mode", () => {
    useThemeStore.getState().setMode("dark");
    expect(useThemeStore.getState().mode).toBe("dark");
    useThemeStore.getState().setMode("light");
    expect(useThemeStore.getState().mode).toBe("light");
  });

  it("persists the mode to localStorage", () => {
    useThemeStore.getState().setMode("dark");
    const raw = window.localStorage.getItem("nousbooks-theme");
    expect(JSON.parse(raw!).state.mode).toBe("dark");
  });
});
