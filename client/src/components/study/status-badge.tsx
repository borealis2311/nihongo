import { STATUS_LABEL, type StudyStatus } from "@/lib/study-store";
import { cn } from "@/lib/utils";

const TONE: Record<StudyStatus, string> = {
  new: "bg-indigo-soft text-indigo-ink",
  learning: "bg-paper text-gold-ink",
  known: "bg-matcha-soft text-matcha-ink",
};

export function StatusBadge({ status, className }: { status: StudyStatus; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-bold", TONE[status], className)}>
      {STATUS_LABEL[status]}
    </span>
  );
}
