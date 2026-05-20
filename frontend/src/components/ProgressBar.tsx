"use client";

interface Props {
  current: number | null;
  total: number | null;
  /** Compact variant — smaller bar, no label. Used inside cramped cards. */
  compact?: boolean;
}

/**
 * Slim reading-progress bar. Shows "current / total" + percentage when there's
 * room (default), or just the bar (compact). Falls back to a placeholder when
 * the total is unknown — the caller is expected to surface a CTA in that case.
 */
export default function ProgressBar({ current, total, compact = false }: Props) {
  const safeCurrent = current ?? 0;
  const hasTotal = total != null && total > 0;
  const pct = hasTotal
    ? Math.min(100, Math.max(0, Math.round((safeCurrent / total!) * 100)))
    : 0;

  return (
    <div className="w-full">
      <div
        className={`w-full overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 ${
          compact ? "h-1.5" : "h-2"
        }`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 shadow-[0_0_8px_rgba(251,146,60,0.5)] transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {!compact && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {hasTotal ? (
            <>
              <span className="font-medium text-zinc-700 dark:text-zinc-200">
                {safeCurrent}
              </span>{" "}
              / {total} pages · {pct}%
            </>
          ) : (
            <span className="text-zinc-400">No page count yet</span>
          )}
        </p>
      )}
    </div>
  );
}
