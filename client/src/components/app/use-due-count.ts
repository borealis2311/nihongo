"use client";

import { useMemo } from "react";
import { isDue, useStudy, useStudyHydrated } from "@/lib/study-store";

/** Số thẻ đến hạn ôn (0 cho tới khi localStorage được nạp). */
export function useDueCount(): number {
  const hydrated = useStudyHydrated();
  const cards = useStudy((s) => s.cards);
  return useMemo(() => {
    if (!hydrated) return 0;
    const now = new Date();
    return Object.values(cards).filter((c) => isDue(c, now)).length;
  }, [cards, hydrated]);
}
