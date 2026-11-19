"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ImageUp,
  Loader2,
  Plus,
  RefreshCw,
  Smartphone,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { toKatakana, toRomaji } from "wanakana";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Chapter } from "@/lib/strapi";
import { resizeImage } from "@/lib/image";
import { cn } from "@/lib/utils";

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

/** Điền katakana / romaji còn trống dựa trên hiragana. */
function fillReadings(row: Row): Row {
  const kana = row.hiragana.trim() || row.katakana.trim();
  if (!kana) return row;
  return {
    ...row,
    katakana: row.katakana.trim() || (row.sentence ? "" : toKatakana(kana)),
    romaji: row.romaji.trim() || toRomaji(kana),
  };
}

export function ImportClient({
  chapters,
  cmsError,
  initialLessonId,
}: {
  chapters: Chapter[];
  cmsError: string | null;
  initialLessonId: string;
}) {
  const lessonOptions = useMemo(
    () =>
      chapters.flatMap((chapter) =>
        chapter.lessons.map((lesson) => ({
          id: lesson.documentId,
          name: lesson.name,
          chapterName: chapter.name,
          href: `/docs/${chapter.slug}/${lesson.slug}`,
        }))
      ),
    [chapters]
  );
  const lessonLabels = useMemo(
    () => Object.fromEntries(lessonOptions.map((o) => [o.id, `${o.chapterName} / ${o.name}`])),
    [lessonOptions]
  );

  const [lessonId, setLessonId] = useState<string | null>(
    lessonOptions.some((o) => o.id === initialLessonId) ? initialLessonId : null
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ count: number; href: string | null } | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [captureUrl, setCaptureUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [receivedCount, setReceivedCount] = useState(0);

  const selectedLesson = lessonOptions.find((o) => o.id === lessonId) ?? null;
  const sentenceCount = rows.filter((r) => r.sentence).length;

  useEffect(() => {
    // Chỉ tạo sau khi mount để tránh lệch giá trị random giữa server và client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessionId(generateSessionId());
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const url = `${window.location.origin}/import/capture/${sessionId}`;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCaptureUrl(url);
    QRCode.toDataURL(url, { margin: 1, width: 240, color: { dark: "#1e1b2e", light: "#ffffff" } })
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
        toast.info("Đã nhận ảnh từ điện thoại, đang trích xuất…");
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

  async function loadFile(file: File) {
    setError(null);
    setSaved(null);
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
    setSaved(null);
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
      else toast.success(`AI tìm thấy ${extracted.length} mục. Kiểm tra lại trước khi lưu nhé.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Trích xuất thất bại.");
    } finally {
      setExtracting(false);
    }
  }

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handlePush() {
    if (!lessonId) {
      setError("Vui lòng chọn bài học để lưu vào.");
      return;
    }
    if (rows.length === 0) {
      setError("Chưa có từ nào để lưu.");
      return;
    }
    setPushing(true);
    setError(null);
    setSaved(null);
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
      if (!res.ok) throw new Error(json.error ?? "Lưu dữ liệu thất bại.");

      setSaved({ count: json.createdCount, href: selectedLesson?.href ?? null });
      toast.success(`Đã lưu ${json.createdCount}/${rows.length} mục vào “${selectedLesson?.name ?? "bài học"}”.`);
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
      setError(err instanceof Error ? err.message : "Lưu dữ liệu thất bại.");
    } finally {
      setPushing(false);
    }
  }

  const groups = useMemo(() => {
    const map = new Map<string, typeof lessonOptions>();
    for (const o of lessonOptions) map.set(o.chapterName, [...(map.get(o.chapterName) ?? []), o]);
    return [...map.entries()];
  }, [lessonOptions]);

  return (
    <div className="flex flex-col gap-6">
      {cmsError && (
        <Alert tone="error">
          Chưa kết nối được CMS nên chưa có danh sách bài học. Bạn vẫn có thể thử trích xuất ảnh.
          <code className="mt-1 block text-xs opacity-80">{cmsError}</code>
        </Alert>
      )}

      {/* Bước 1: chọn bài học */}
      <Step number={1} title="Chọn bài học để lưu vào" description="Từ trích xuất được sẽ thêm vào cuối bài này.">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-[1_1_320px]">
            <Select value={lessonId} onValueChange={(v) => setLessonId(v as string)} items={lessonLabels}>
              <SelectTrigger aria-label="Bài học" className="min-h-12 text-[15px]">
                <SelectValue placeholder="Chọn bài học" />
              </SelectTrigger>
              <SelectContent>
                {groups.map(([chapter, options]) => (
                  <SelectGroup key={chapter}>
                    <SelectGroupLabel>{chapter}</SelectGroupLabel>
                    {options.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedLesson && (
            <Link href={selectedLesson.href} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
              Mở bài học <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      </Step>

      {/* Bước 2: ảnh */}
      <Step number={2} title="Gửi ảnh trang sách" description="Dùng điện thoại để chụp, hoặc chọn ảnh có sẵn trên máy này.">
        <div className="flex flex-wrap gap-5">
          <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 rounded-2xl border border-paper-line bg-paper p-5 sm:flex-row sm:items-center">
            <div className="flex size-40 shrink-0 items-center justify-center self-center rounded-2xl bg-white p-2.5 shadow-sm">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="Mã QR để mở trang chụp trên điện thoại" className="size-full" />
              ) : (
                <div className="size-full animate-pulse rounded-lg bg-muted" />
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-2 text-sm">
              <span className="flex items-center gap-2 font-extrabold text-gold-ink">
                <Smartphone className="size-4" aria-hidden /> Chụp bằng điện thoại
              </span>
              <p className="leading-relaxed text-gold-ink/90">
                Quét mã QR, chụp ảnh — ảnh tự gửi về đây và được trích xuất ngay.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-card px-2.5 py-1 font-mono text-sm font-bold tracking-widest">
                  {sessionId ?? "······"}
                </span>
                <span className="text-xs text-gold-ink/80">Đã nhận {receivedCount} ảnh</span>
              </div>
              {captureUrl && (
                <a href={captureUrl} target="_blank" rel="noreferrer" className="truncate text-xs text-gold-ink underline underline-offset-2">
                  {captureUrl}
                </a>
              )}
              <button
                type="button"
                onClick={refreshSession}
                className="inline-flex min-h-9 items-center gap-1.5 self-start rounded-lg bg-card px-3 text-[13px] font-bold text-gold-ink hover:bg-white"
              >
                <RefreshCw className="size-3.5" aria-hidden /> Làm mới phiên
              </button>
            </div>
          </div>

          <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-3">
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) void loadFile(file);
              }}
              className={cn(
                "relative flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed p-4 text-center transition-colors",
                dragging ? "border-primary bg-indigo-soft" : "border-border bg-background hover:border-primary/60"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void loadFile(file);
                }}
              />
              {previewUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Ảnh đã chọn" className="max-h-56 w-full rounded-xl object-contain" />
                  <AnimatePresence>
                    {extracting && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/80 backdrop-blur-sm"
                      >
                        <motion.span
                          animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.1, 1] }}
                          transition={{ duration: 1.4, repeat: Infinity }}
                          className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"
                        >
                          <Sparkles className="size-6" aria-hidden />
                        </motion.span>
                        <span className="text-sm font-bold">AI đang đọc ảnh…</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <span className="text-xs text-muted-foreground">Bấm hoặc kéo ảnh khác vào để thay</span>
                </>
              ) : (
                <>
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-indigo-soft text-primary">
                    <ImageUp className="size-7" aria-hidden />
                  </span>
                  <span className="text-[15px] font-bold">Chọn hoặc kéo thả ảnh vào đây</span>
                  <span className="text-[13px] text-muted-foreground">Trên điện thoại sẽ mở camera để chụp</span>
                </>
              )}
            </label>
            <button
              type="button"
              onClick={() => imageBlob && runExtraction(imageBlob)}
              disabled={!imageBlob || extracting}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-extrabold text-primary-foreground shadow-[0_4px_0_var(--indigo-ink)] transition-transform active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
            >
              {extracting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
              {extracting ? "Đang trích xuất…" : "Trích xuất bằng AI"}
            </button>
          </div>
        </div>
      </Step>

      {/* Bước 3: kiểm tra & lưu */}
      <Step
        number={3}
        title="Kiểm tra và lưu"
        description={
          rows.length > 0
            ? `${rows.length - sentenceCount} từ vựng · ${sentenceCount} mẫu câu. Cột “Nghĩa” là tiếng Việt.`
            : "Kết quả trích xuất sẽ hiện ở đây để bạn sửa trước khi lưu."
        }
        actions={
          rows.length > 0 ? (
            <button
              type="button"
              onClick={() => setRows((prev) => prev.map(fillReadings))}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-indigo-soft px-3.5 text-sm font-bold text-primary"
            >
              <Wand2 className="size-4" aria-hidden /> Tự điền katakana &amp; romaji
            </button>
          ) : undefined
        }
      >
        {rows.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="hidden grid-cols-[1.4fr_1.2fr_1.2fr_1.2fr_64px_44px] gap-2.5 px-1 text-xs font-bold tracking-wide text-muted-foreground uppercase lg:grid">
              <span>Nghĩa</span>
              <span>Hiragana</span>
              <span>Katakana</span>
              <span>Romaji</span>
              <span>Câu?</span>
              <span className="sr-only">Xoá</span>
            </div>
            <AnimatePresence initial={false}>
              {rows.map((row, i) => (
                <motion.div
                  key={i}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-2 gap-2.5 rounded-2xl border border-border bg-background p-3 lg:grid-cols-[1.4fr_1.2fr_1.2fr_1.2fr_64px_44px] lg:items-center lg:border-0 lg:bg-transparent lg:p-1"
                >
                  <Field label="Nghĩa" className="col-span-2 lg:col-span-1">
                    <Input value={row.word} onChange={(e) => updateRow(i, { word: e.target.value })} className={inputClass} />
                  </Field>
                  <Field label="Hiragana">
                    <Input
                      value={row.hiragana}
                      onChange={(e) => updateRow(i, { hiragana: e.target.value })}
                      onBlur={() => updateRow(i, fillReadings(row))}
                      className={cn(inputClass, "jp")}
                    />
                  </Field>
                  <Field label="Katakana">
                    <Input value={row.katakana} onChange={(e) => updateRow(i, { katakana: e.target.value })} className={cn(inputClass, "jp")} />
                  </Field>
                  <Field label="Romaji">
                    <Input value={row.romaji} onChange={(e) => updateRow(i, { romaji: e.target.value })} className={inputClass} />
                  </Field>
                  <label className="flex items-center gap-2 text-sm font-semibold lg:justify-center">
                    <Switch checked={row.sentence} onCheckedChange={(checked) => updateRow(i, { sentence: checked })} />
                    <span className="lg:sr-only">Mẫu câu</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    aria-label={`Xoá dòng ${i + 1}`}
                    className="col-span-2 flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold text-vermilion-ink hover:bg-vermilion-soft lg:col-span-1 lg:size-11"
                  >
                    <Trash2 className="size-4" aria-hidden />
                    <span className="lg:hidden">Xoá dòng</span>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, { ...emptyRow }])}
          className="inline-flex min-h-10 items-center gap-1.5 self-start rounded-xl border-[1.5px] border-dashed border-border px-3.5 text-sm font-bold text-sidebar-foreground hover:bg-muted"
        >
          <Plus className="size-4" aria-hidden /> Thêm dòng
        </button>

        {error && <Alert tone="error">{error}</Alert>}
        {saved && (
          <Alert tone="success">
            Đã lưu {saved.count} mục vào Strapi.{" "}
            {saved.href && (
              <Link href={saved.href} className="font-bold underline underline-offset-2">
                Xem bài học
              </Link>
            )}
          </Alert>
        )}

        <button
          type="button"
          onClick={handlePush}
          disabled={pushing || rows.length === 0}
          className="flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-matcha text-base font-extrabold text-white shadow-[0_4px_0_var(--matcha-ink)] transition-transform active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
        >
          {pushing && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {pushing
            ? "Đang lưu lên Strapi…"
            : rows.length > 0
              ? `Lưu ${rows.length} mục vào ${selectedLesson ? `“${selectedLesson.name}”` : "bài học"}`
              : "Lưu vào bài học"}
        </button>
      </Step>
    </div>
  );
}

const inputClass = "h-11 rounded-xl border-[1.5px] bg-card text-[15px]";

function Step({
  number,
  title,
  description,
  actions,
  children,
}: {
  number: number;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-sm font-extrabold text-background">
            {number}
          </span>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[17px] font-bold">{title}</h2>
            {description && <p className="text-[13px] text-muted-foreground">{description}</p>}
          </div>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      <span className="text-xs font-semibold text-muted-foreground lg:sr-only">{label}</span>
      {children}
    </label>
  );
}

function Alert({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold",
        tone === "error" ? "bg-vermilion-soft text-vermilion-ink" : "bg-matcha-soft text-matcha-ink"
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
