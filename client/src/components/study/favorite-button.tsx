"use client";

import { Bookmark } from "lucide-react";
import { motion } from "motion/react";
import { useStudy, useStudyHydrated } from "@/lib/study-store";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  id,
  withLabel = false,
  className,
}: {
  id: string;
  withLabel?: boolean;
  className?: string;
}) {
  const hydrated = useStudyHydrated();
  const saved = useStudy((s) => !!s.favorites[id]) && hydrated;
  const toggle = useStudy((s) => s.toggleFavorite);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggle(id);
      }}
      aria-pressed={saved}
      aria-label={withLabel ? undefined : saved ? "Bỏ khỏi Yêu thích" : "Thêm vào Yêu thích"}
      className={cn(
        "flex shrink-0 items-center justify-center gap-2 rounded-xl border-[1.5px] font-bold transition-colors active:scale-95",
        withLabel ? "min-h-13 px-4 text-[15px]" : "size-11",
        saved
          ? "border-matcha bg-matcha text-white"
          : "border-border bg-card text-sidebar-foreground hover:bg-muted",
        className
      )}
    >
      <motion.span
        key={saved ? "on" : "off"}
        initial={{ scale: saved ? 0.6 : 1 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
        className="flex"
      >
        <Bookmark className="size-[18px]" fill={saved ? "currentColor" : "none"} aria-hidden />
      </motion.span>
      {withLabel && (saved ? "Đã yêu thích" : "Yêu thích")}
    </button>
  );
}
