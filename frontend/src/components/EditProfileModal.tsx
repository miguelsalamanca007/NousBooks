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
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Name <span className="text-zinc-400">(optional)</span>
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          disabled={update.isPending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {update.isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
