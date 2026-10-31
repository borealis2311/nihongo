"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Chapter } from "@/lib/strapi";
import { resizeImage } from "@/lib/image";

interface Row {
  word: string;
  hiragana: string;
  katakana: string;
  romaji: string;
  sentence: boolean;
}

const emptyRow: Row = { word: "", hiragana: "", katakana: "", romaji: "", sentence: false };
const SESSION_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SESSION_POLL_MS = 2500;

function generateSessionId(length = 6): string {
  let id = "";
  for (let i = 0; i < length; i++) {
    id += SESSION_CHARS[Math.floor(Math.random() * SESSION_CHARS.length)];
  }
  return id;
}

export function ImportClient({ chapters }: { chapters: Chapter[] }) {
  const [lessonId, setLessonId] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [captureUrl, setCaptureUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [receivedCount, setReceivedCount] = useState(0);

  useEffect(() => {
    // Chỉ tạo sau khi mount để tránh lệch giá trị random giữa server và client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessionId(generateSessionId());
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const url = `${window.location.origin}/import/capture/${sessionId}`;
    console.log(url);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCaptureUrl(url);
    QRCode.toDataURL(url, { margin: 1, width: 200 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/capture-session/${sessionId}`, { cache: "no-store" });
        const json = await res.json();
        if (cancelled || !json.ready || !json.image) return;

        const blob = await (await fetch(json.image)).blob();
        setPreviewUrl((prev) => {
          if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
          return json.image;
        });
        setImageBlob(blob);
        setReceivedCount((n) => n + 1);
        await runExtraction(blob);
      } catch {
        // Bỏ qua lỗi polling, sẽ thử lại ở lần sau.
      }
    }, SESSION_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionId]);

  function refreshSession() {
    setReceivedCount(0);
    setSessionId(generateSessionId());
  }

  const lessonOptions = useMemo(
    () =>
      chapters.flatMap((chapter) =>
        chapter.lessons.map((lesson) => ({
          id: lesson.documentId,
          label: `${chapter.name} / ${lesson.name}`,
        }))
      ),
    [chapters]
  );

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    try {
      const blob = await resizeImage(file);
      setImageBlob(blob);
      setPreviewUrl((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đọc được ảnh.");
    }
  }

  async function runExtraction(blob: Blob) {
    setExtracting(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("image", blob, "capture.jpg");
      const res = await fetch("/api/extract-words", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Trích xuất thất bại.");

      const extracted: Row[] = (json.words ?? []).map((w: Partial<Row>) => ({
        word: w.word ?? "",
        hiragana: w.hiragana ?? "",
        katakana: w.katakana ?? "",
        romaji: w.romaji ?? "",
        sentence: Boolean(w.sentence),
      }));
      setRows((prev) => [...prev, ...extracted]);
      if (extracted.length === 0) setError("Không tìm thấy từ vựng nào trong ảnh.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Trích xuất thất bại.");
    } finally {
      setExtracting(false);
    }
  }

  async function handleExtractClick() {
    if (!imageBlob) return;
    await runExtraction(imageBlob);
  }

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function addRow() {
    setRows((prev) => [...prev, { ...emptyRow }]);
  }

  async function handlePush() {
    if (!lessonId) {
      setError("Vui lòng chọn bài học.");
      return;
    }
    if (rows.length === 0) {
      setError("Chưa có từ nào để đẩy lên.");
      return;
    }
    setPushing(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/words/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          words: rows.map((r) => ({
            word: r.word,
            hiragana: r.hiragana || null,
            katakana: r.katakana || null,
            romaji: r.romaji || null,
            sentence: r.sentence,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Đẩy dữ liệu thất bại.");

      setResult(`Đã tạo ${json.createdCount}/${rows.length} từ trên Strapi.`);
      if (json.errors?.length) {
        setError(
          json.errors
            .map((e: { word: string; error: string }) => `${e.word || "(trống)"}: ${e.error}`)
            .join("; ")
        );
      } else {
        setRows([]);
        setImageBlob(null);
        setPreviewUrl((prev) => {
          if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
          return null;
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đẩy dữ liệu thất bại.");
    } finally {
      setPushing(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="lesson">
          Bài học
        </label>
        <select
          id="lesson"
          value={lessonId}
          onChange={(e) => setLessonId(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="">-- Chọn bài học --</option>
          {lessonOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3 rounded-xl p-4 ring-1 ring-foreground/10 sm:flex-row sm:items-center">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="QR ghép điện thoại" className="size-36 shrink-0 rounded-lg" />
        ) : (
          <div className="size-36 shrink-0 animate-pulse rounded-lg bg-muted" />
        )}
        <div className="flex flex-col gap-1 text-sm">
          <p className="font-medium text-foreground">Chụp bằng điện thoại</p>
          <p className="text-muted-foreground">
            Quét mã QR hoặc mở{" "}
            {captureUrl ? (
              <a href={captureUrl} target="_blank" rel="noreferrer" className="underline">
                {captureUrl}
              </a>
            ) : (
              "..."
            )}{" "}
            trên điện thoại. Ảnh chụp sẽ tự động gửi về đây và trích xuất luôn.
          </p>
          <p className="text-muted-foreground">
            Mã phiên: <span className="font-mono text-foreground">{sessionId ?? "..."}</span> · Đã
            nhận {receivedCount} ảnh
          </p>
          <Button variant="outline" size="sm" onClick={refreshSession} className="self-start">
            Làm mới phiên
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="image">
          Hoặc chụp / chọn ảnh trực tiếp trên máy này
        </label>
        <input
          ref={fileInputRef}
          id="image"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="text-sm text-foreground file:mr-2 file:h-7 file:rounded-lg file:border-0 file:bg-secondary file:px-2.5 file:text-sm file:font-medium file:text-secondary-foreground"
        />
      </div>

      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Ảnh đã chọn"
          className="max-h-64 w-full rounded-lg object-contain ring-1 ring-foreground/10"
        />
      )}

      <Button onClick={handleExtractClick} disabled={!imageBlob || extracting}>
        {extracting ? "Đang trích xuất..." : "Trích xuất từ vựng (GPT-4o)"}
      </Button>

      {rows.length > 0 && (
        <div className="flex flex-col gap-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Từ</TableHead>
                <TableHead>Hiragana</TableHead>
                <TableHead>Katakana</TableHead>
                <TableHead>Romaji</TableHead>
                <TableHead>Câu?</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Input
                      value={row.word}
                      onChange={(e) => updateRow(i, { word: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.hiragana}
                      onChange={(e) => updateRow(i, { hiragana: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.katakana}
                      onChange={(e) => updateRow(i, { katakana: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.romaji}
                      onChange={(e) => updateRow(i, { romaji: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={row.sentence}
                      onCheckedChange={(checked) => updateRow(i, { sentence: checked })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-sm" onClick={() => removeRow(i)}>
                      ✕
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button variant="outline" size="sm" onClick={addRow} className="self-start">
            + Thêm dòng
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {result && <p className="text-sm text-emerald-600">{result}</p>}

      <Button onClick={handlePush} disabled={pushing || rows.length === 0} variant="secondary">
        {pushing ? "Đang đẩy lên Strapi..." : `Đẩy ${rows.length || ""} từ lên Strapi`}
      </Button>
    </div>
  );
}
