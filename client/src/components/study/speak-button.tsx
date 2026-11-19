"use client";

import { Volume2 } from "lucide-react";
import { useSpeak, useTtsSupported } from "@/lib/speech";
import { cn } from "@/lib/utils";

export function SpeakButton({
  text,
  label,
  size = "md",
  className,
}: {
  text: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const supported = useTtsSupported();
  const { speak, speakingText } = useSpeak();
  const speaking = speakingText === text;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
      disabled={!supported || !text}
      aria-label={label ?? `Nghe phát âm ${text}`}
      title={supported ? "Nghe phát âm" : "Trình duyệt không hỗ trợ đọc to"}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-muted text-sidebar-foreground transition-[transform,background-color] hover:bg-indigo-soft hover:text-primary active:scale-95 disabled:opacity-40",
        size === "sm" && "size-10",
        size === "md" && "size-11",
        size === "lg" && "size-13 rounded-2xl bg-indigo-soft text-primary",
        speaking && "bg-indigo-soft text-primary",
        className
      )}
    >
      <Volume2 className={cn(size === "lg" ? "size-6" : "size-[18px]", speaking && "animate-pulse")} aria-hidden />
    </button>
  );
}
