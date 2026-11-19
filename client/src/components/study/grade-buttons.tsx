"use client";

import { useMemo } from "react";
import type { Grade } from "ts-fsrs";
import { GRADES, formatInterval, previewIntervals, type StoredCard } from "@/lib/study-store";
import { cn } from "@/lib/utils";

const TONE = {
  vermilion: "border-vermilion/40 bg-vermilion-soft text-vermilion-ink",
  gold: "border-gold/40 bg-paper text-gold-ink",
  indigo: "border-primary/30 bg-indigo-soft text-indigo-ink",
  matcha: "border-matcha/40 bg-matcha-soft text-matcha-ink",
} as const;

export function GradeButtons({
  card,
  onGrade,
  suggested,
}: {
  card: StoredCard | undefined;
  onGrade: (rating: Grade) => void;
  suggested?: Grade | null;
}) {
  const intervals = useMemo(() => {
    const now = new Date();
    const preview = previewIntervals(card, now);
    return Object.fromEntries(GRADES.map((g) => [g.rating, formatInterval(preview[g.rating], now)]));
  }, [card]);

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {GRADES.map((g) => (
        <button
          key={g.rating}
          type="button"
          onClick={() => onGrade(g.rating)}
          className={cn(
            "flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 transition-transform active:scale-95",
            TONE[g.tone],
            suggested === g.rating && "ring-3 ring-offset-2 ring-offset-card ring-current"
          )}
        >
          <span className="text-[15px] font-extrabold">{g.label}</span>
          <span className="text-xs font-semibold opacity-85">{intervals[g.rating]}</span>
        </button>
      ))}
    </div>
  );
}
