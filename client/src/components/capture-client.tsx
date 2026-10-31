"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resizeImage } from "@/lib/image";

type Status = "idle" | "uploading" | "sent" | "error";

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
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <div>
        <h1 className="font-heading text-lg font-semibold text-foreground">Chụp ảnh từ vựng</h1>
        <p className="text-sm text-muted-foreground">
          Ảnh sẽ tự động gửi về máy tính đang mở phiên <span className="font-mono">{sessionId}</span>.
        </p>
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

      <Button
        size="lg"
        disabled={status === "uploading"}
        onClick={() => fileInputRef.current?.click()}
        className="h-16 w-16 rounded-full p-0"
      >
        <Camera className="size-6" />
      </Button>

      <div className="text-sm">
        {status === "idle" && <span className="text-muted-foreground">Bấm để chụp ảnh</span>}
        {status === "uploading" && <span className="text-muted-foreground">Đang gửi...</span>}
        {status === "sent" && (
          <span className="text-emerald-600">
            Đã gửi ✓ ({sentCount}). Có thể chụp tiếp trang khác nếu cần.
          </span>
        )}
        {status === "error" && <span className="text-destructive">{error}</span>}
      </div>
    </div>
  );
}
