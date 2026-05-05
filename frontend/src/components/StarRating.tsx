"use client";

import { useState } from "react";

interface Props {
  value: number | null;
  onChange?: (rating: number | null) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
}

/**
 * 1-5 star rating widget.
 * - Hover shows a preview of the rating that would be set.
 * - Clicking a filled star that matches the current value clears the rating.
 * - When readOnly is true the component renders without any interactivity.
 */
export default function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
}: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  const active = hovered ?? value;
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={() => setHovered(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => {
            if (readOnly || !onChange) return;
            // Clicking the current rating clears it
            onChange(value === star ? null : star);
          }}
          onMouseEnter={() => { if (!readOnly) setHovered(star); }}
          aria-label={`Rate ${star} out of 5`}
          className={`transition-colors ${readOnly ? "cursor-default" : "cursor-pointer"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={`${starSize} transition-colors ${
              active !== null && star <= active
                ? "fill-amber-400 text-amber-400"
                : "fill-zinc-200 text-zinc-200 dark:fill-zinc-700 dark:text-zinc-700"
            }`}
          >
            <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
          </svg>
        </button>
      ))}
    </div>
  );
}
