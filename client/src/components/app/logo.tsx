import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5 text-foreground", className)}>
      <span className="jp-serif flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-[22px] font-bold text-primary-foreground">
        日
      </span>
      {!compact && (
        <span className="flex flex-col leading-tight">
          <span className="text-lg font-extrabold">Nihongo Việt</span>
          <span className="jp text-xs text-muted-foreground">ことば・ベト</span>
        </span>
      )}
    </Link>
  );
}
