"use client";

export default function AddToLibraryButton({
  isAdding,
  isAdded,
  onAdd,
  size = "sm",
}: {
  isAdding: boolean;
  isAdded: boolean;
  onAdd: () => void;
  size?: "sm" | "md";
}) {
  const base =
    size === "md"
      ? "mt-6 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
      : "mt-3 rounded-full px-3 py-1 text-xs font-semibold transition-colors";

  if (isAdded) {
    return (
      <button
        disabled
        className={`${base} flex items-center gap-1.5 border border-lime-400 bg-lime-100 text-lime-700 dark:border-lime-500 dark:bg-lime-900/40 dark:text-lime-300`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3.5 w-3.5 shrink-0"
        >
          <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
            clipRule="evenodd"
          />
        </svg>
        Added
      </button>
    );
  }

  return (
    <button
      onClick={onAdd}
      disabled={isAdding}
      className={`${base} border border-zinc-300 text-zinc-700 hover:bg-amber-100 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-amber-900/40`}
    >
      {isAdding ? "Adding…" : "+ Add to library"}
    </button>
  );
}
