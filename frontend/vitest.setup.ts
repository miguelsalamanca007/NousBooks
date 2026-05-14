import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// happy-dom / jsdom can be flaky about exposing a working localStorage.
// Install a minimal in-memory polyfill if methods are missing so Zustand's
// persist middleware can read and write.
function installLocalStoragePolyfill(target: Storage | undefined): Storage {
  const store = new Map<string, string>();
  const polyfill: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };
  if (target && typeof target.setItem === "function") return target;
  return polyfill;
}

const polyfilled = installLocalStoragePolyfill(
  (globalThis as { localStorage?: Storage }).localStorage
);

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: polyfilled,
});
if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: polyfilled,
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
});
