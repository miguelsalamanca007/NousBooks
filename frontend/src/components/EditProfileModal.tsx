"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, userApi } from "@/lib/api";
import Modal from "@/components/Modal";
import { User } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ open, onClose }: Props) {
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: userApi.getMe,
    enabled: open,
  });

  // The inner <Form> seeds its state from `me` via useState initializers, so
  // we only mount it once the data has arrived. Each fresh open of the modal
  // remounts the form (Modal returns null when !open), which gives us clean
  // state without needing an effect to reset fields.
  return (
    <Modal open={open} onClose={onClose} title="Edit profile">
      {me ? (
        <Form me={me} onClose={onClose} />
      ) : (
        <p className="text-sm text-zinc-400">Loading…</p>
      )}
    </Modal>
  );
}

function Form({ me, onClose }: { me: User; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(me.name ?? "");
  const [email, setEmail] = useState(me.email);
  const [error, setError] = useState<string | null>(null);

  const update = useMutation({
    mutationFn: (data: { name?: string; email?: string }) => userApi.update(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["me"], updated);
      onClose();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError("That email is already in use by another account.");
          return;
        }
        if (err.status === 400) {
          const body = err.body as { errors?: Record<string, string> };
          const messages = Object.values(body.errors ?? {}).join(" ");
          setError(messages || "Check your input and try again.");
          return;
        }
      }
      setError("Could not update your profile. Try again.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Send only the fields that actually changed — the backend treats null
    // as "don't touch", so an unchanged email stays untouched.
    const data: { name?: string; email?: string } = {};
    const trimmedName = name.trim();
    if (trimmedName !== (me.name ?? "")) data.name = trimmedName;
    if (email.trim() !== me.email) data.email = email.trim();

    if (Object.keys(data).length === 0) {
      onClose();
      return;
    }
    update.mutate(data);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Name <span className="text-zinc-400">(optional)</span>
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          className="nb-input"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="nb-input"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-zinc-300/80 bg-white/70 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700/80 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={update.isPending}
          className="nb-btn-primary rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {update.isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
