"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useThemeStore, ThemeMode } from "@/store/theme";
import EditProfileModal from "@/components/EditProfileModal";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import AboutModal from "@/components/AboutModal";

/**
 * Avatar button + dropdown that lives at the right edge of the navbar.
 * Replaces the standalone sign-out icon: now sign-out is one entry among
 * profile editing, password change, theme toggle, and about.
 */
export default function UserMenu() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);

  const [open, setOpen] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [about, setAbout] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: userApi.getMe,
  });

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSignOut() {
    queryClient.clear();
    logout();
    router.push("/login");
  }

  // Best display name: explicit name, otherwise the local part of the email
  const displayName = me?.name?.trim() || me?.email.split("@")[0] || "";
  const initial = (displayName[0] ?? "?").toUpperCase();

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Open user menu"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
        >
          {initial}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-zinc-200 bg-white py-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            {/* Profile header */}
            <div className="px-4 pb-2">
              <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                {displayName}
              </p>
              {me?.email && (
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {me.email}
                </p>
              )}
            </div>

            <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

            {/* Profile + password */}
            <MenuButton
              onClick={() => { setOpen(false); setEditProfile(true); }}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 19.5a7.5 7.5 0 0 1 15 0v.75H4.5v-.75Z" />
                </svg>
              }
              label="Edit profile"
            />
            <MenuButton
              onClick={() => { setOpen(false); setChangePassword(true); }}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              }
              label={me?.hasPassword ? "Change password" : "Set password"}
            />

            <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

            {/* Theme switcher */}
            <ThemeSwitcher />

            <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

            <MenuButton
              onClick={() => { setOpen(false); setAbout(true); }}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
              }
              label="About"
            />

            <MenuButton
              onClick={handleSignOut}
              destructive
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                </svg>
              }
              label="Sign out"
            />
          </div>
        )}
      </div>

      <EditProfileModal open={editProfile} onClose={() => setEditProfile(false)} />
      <ChangePasswordModal open={changePassword} onClose={() => setChangePassword(false)} />
      <AboutModal open={about} onClose={() => setAbout(false)} />
    </>
  );
}

// ── MenuButton ───────────────────────────────────────────────────────────────

function MenuButton({
  icon,
  label,
  onClick,
  destructive = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  const color = destructive
    ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
    : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800";

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors ${color}`}
    >
      <span className="text-zinc-500 dark:text-zinc-400">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ── ThemeSwitcher ────────────────────────────────────────────────────────────

function ThemeSwitcher() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const options: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    {
      value: "light",
      label: "Light",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        </svg>
      ),
    },
    {
      value: "dark",
      label: "Dark",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
        </svg>
      ),
    },
    {
      value: "system",
      label: "Auto",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
        </svg>
      ),
    },
  ];

  return (
    <div className="px-4 py-2">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        Theme
      </p>
      <div className="flex rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setMode(opt.value)}
            aria-pressed={mode === opt.value}
            className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              mode === opt.value
                ? "bg-white text-zinc-800 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
