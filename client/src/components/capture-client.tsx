"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { AlertCircle, Camera, CheckCircle2, Loader2 } from "lucide-react";
import { resizeImage } from "@/lib/image";
import { cn } from "@/lib/utils";

type Status = "idle" | "uploading" | "sent" | "error";

/** Trang mở trên điện thoại (quét QR) để chụp ảnh và gửi về máy tính. */
export function CaptureClient({ sessionId }: { sessionId: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sentCount, setSentCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    setError(null);
    try {
      const blob = await resizeImage(file);
      const formData = new FormData();
      formData.append("image", blob, "capture.jpg");
      const res = await fetch(`/api/capture-session/${sessionId}`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gửi ảnh thất bại.");
      setStatus("sent");
      setSentCount((n) => n + 1);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Gửi ảnh thất bại.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-between gap-8 bg-background px-6 pt-10 pb-[max(env(safe-area-inset-bottom),32px)] text-center">
      <div className="flex items-center gap-2.5">
        <span className="jp-serif flex size-10 items-center justify-center rounded-xl bg-primary text-[22px] font-bold text-primary-foreground">
          日
        </span>
        <span className="text-lg font-extrabold">Nihongo Việt</span>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-[26px] font-extrabold">Chụp ảnh từ vựng</h1>
          <p className="max-w-xs text-[15px] leading-relaxed text-muted-foreground">
            Ảnh sẽ tự gửi về máy tính đang mở phiên
          </p>
          <span className="mx-auto rounded-xl bg-card px-4 py-1.5 font-mono text-lg font-bold tracking-[0.3em] ring-1 ring-border">
            {sessionId}
          </span>
        </div>

        <input
          ref={fileInputRef}
          id="capture-input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="relative flex size-44 items-center justify-center">
          {status !== "uploading" && (
            <motion.span
              aria-hidden
              className="absolute inset-4 rounded-full bg-primary/25"
              animate={{ scale: [1, 1.25], opacity: [0.6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            disabled={status === "uploading"}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Chụp ảnh"
            className="relative flex size-32 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_0_var(--indigo-ink)] disabled:opacity-70"
          >
            {status === "uploading" ? (
              <Loader2 className="size-12 animate-spin" aria-hidden />
            ) : (
              <Camera className="size-12" aria-hidden />
            )}
          </motion.button>
        </div>

        <div className="min-h-16" aria-live="polite">
          {status === "idle" && <p className="text-[15px] text-muted-foreground">Bấm nút để mở camera</p>}
          {status === "uploading" && <p className="text-[15px] font-semibold">Đang gửi ảnh…</p>}
          {(status === "sent" || status === "error") && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex max-w-xs items-start gap-2.5 rounded-2xl px-4 py-3 text-left text-sm font-semibold",
                status === "sent" ? "bg-matcha-soft text-matcha-ink" : "bg-vermilion-soft text-vermilion-ink"
              )}
            >
              {status === "sent" ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
              ) : (
                <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
              )}
              <span>
                {status === "sent"
                  ? `Đã gửi ${sentCount} ảnh. Xem kết quả trên máy tính, hoặc chụp tiếp trang khác.`
                  : error}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
        Mẹo: chụp thẳng, đủ sáng và để cả trang nằm trong khung để AI đọc chính xác hơn.
      </p>
    </div>
  );
}
