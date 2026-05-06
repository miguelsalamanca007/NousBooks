"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ApiError, userApi } from "@/lib/api";
import Modal from "@/components/Modal";
import { User } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: Props) {
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: userApi.getMe,
    enabled: open,
  });

  // See EditProfileModal — the inner Form takes `me` as a prop and seeds its
  // state via useState initializers, so each modal open starts fresh without
  // resorting to a useEffect that calls setState.
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={me && !me.hasPassword ? "Set password" : "Change password"}
    >
      {me ? (
        <Form me={me} onClose={onClose} />
      ) : (
        <p className="text-sm text-zinc-400">Loading…</p>
      )}
    </Modal>
  );
}

function Form({ me, onClose }: { me: User; onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const change = useMutation({
    mutationFn: userApi.changePassword,
    onSuccess: () => onClose(),
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("Current password is incorrect.");
          return;
        }
        if (err.status === 400) {
          setError("Password must be at least 8 characters.");
          return;
        }
      }
      setError("Could not change your password. Try again.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("New password and confirmation don't match.");
      return;
    }
    if (me.hasPassword && !currentPassword) {
      setError("Please enter your current password.");
      return;
    }

    change.mutate({
      currentPassword: me.hasPassword ? currentPassword : undefined,
      newPassword,
    });
  }

  // OAuth-only users (no password yet) are setting their first password.
  const settingFirstPassword = !me.hasPassword;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {settingFirstPassword && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          You currently sign in with Google. Setting a password lets you sign
          in with your email too.
        </p>
      )}

      {!settingFirstPassword && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Current password
          </label>
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          New password
        </label>
        <input
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <p className="text-xs text-zinc-400">At least 8 characters</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Confirm new password
        </label>
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={change.isPending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {change.isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
