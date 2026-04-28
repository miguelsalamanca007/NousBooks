"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notesApi } from "@/lib/api";

export default function NoteDetailPage() {
  const [, startTransition] = useTransition();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const { data: note, isLoading } = useQuery({
    queryKey: ["note", id],
    queryFn: () => notesApi.getById(Number(id)),
    enabled: !!id,
  });

  // Initialize local state when the note loads for the first time (or when we
  // navigate to a different note). We key on `note.id` so a background refetch
  // after auto-save doesn't clobber what the user is currently typing.
  useEffect(() => {
    if (!note) return;
    startTransition(() => {
      setTitle(note.title ?? "");
      setContent(note.content);
    });
  }, [note?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the textarea height in sync with the content — grows as you type.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
      setTitle(note.title ?? "");
      setContent(note.content);
    });
