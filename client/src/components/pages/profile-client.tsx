"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, Download, Play, Upload } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { lessonStats } from "@/lib/library";
import { useJapaneseVoices, useSpeak, useTtsSupported } from "@/lib/speech";
import { STATUS_LABEL, isDue, statusOf, useStudy, useStudyHydrated } from "@/lib/study-store";
import type { Library } from "@/lib/strapi";
import { jpText, romajiOf } from "@/lib/text";
import { cn } from "@/lib/utils";

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvCell(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function ProfileClient({ library }: { library: Library }) {
  const { items, lessons } = library;
  const hydrated = useStudyHydrated();
  const cards = useStudy((s) => s.cards);
  const favorites = useStudy((s) => s.favorites);
  const settings = useStudy((s) => s.settings);
  const updateSettings = useStudy((s) => s.updateSettings);
  const importData = useStudy((s) => s.importData);
  const resetProgress = useStudy((s) => s.resetProgress);
  const { resolvedTheme, setTheme } = useTheme();
  const voices = useJapaneseVoices();
  const ttsSupported = useTtsSupported();
  const { speak } = useSpeak();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const stats = useMemo(() => {
    const now = new Date();
    return [
      { label: "Từ đã lưu", value: items.filter((i) => !i.sentence).length, sub: `trong ${lessons.length} bài học`, tone: "text-primary" },
      { label: "Câu đã lưu", value: items.filter((i) => i.sentence).length, sub: "mẫu câu kèm nghĩa", tone: "text-matcha" },
      {
        label: "Thẻ đã học",
        value: hydrated ? Object.keys(cards).length : "—",
        sub: hydrated ? `${Object.keys(favorites).length} mục yêu thích` : "",
        tone: "text-gold-ink",
      },
      {
        label: "Cần ôn hôm nay",
        value: hydrated ? items.filter((i) => isDue(cards[i.id], now)).length : "—",
        sub: "thẻ đến hạn",
        tone: "text-vermilion",
      },
    ];
  }, [items, lessons.length, cards, favorites, hydrated]);

  const lists = useMemo(() => lessonStats(items, lessons), [items, lessons]);

  const exportCsv = () => {
    const header = ["loai", "tieng_nhat", "hiragana", "katakana", "romaji", "nghia", "chuong", "bai", "trang_thai", "on_tiep"];
    const lines = items.map((i) =>
      [
        i.sentence ? "cau" : "tu",
        jpText(i),
        i.hiragana,
        i.katakana,
        romajiOf(i),
        i.meaning,
        i.chapterName,
        i.lessonName,
        STATUS_LABEL[statusOf(cards[i.id])],
        cards[i.id]?.due ?? "",
      ]
        .map(csvCell)
        .join(",")
    );
    download("nihongo-tu-vung.csv", "﻿" + [header.join(","), ...lines].join("\n"), "text/csv;charset=utf-8");
  };

  const exportProgress = () => {
    download(
      `nihongo-tien-trinh-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ app: "nihongo-viet", version: 1, cards, favorites, settings }, null, 2),
      "application/json"
    );
  };

  const onImport = async (file: File) => {
    try {
      const ok = importData(JSON.parse(await file.text()));
      if (ok) toast.success("Đã nhập dữ liệu học.");
      else toast.error("File không đúng định dạng.");
    } catch {
      toast.error("Không đọc được file JSON.");
    }
  };

  const voiceItems = useMemo(
    () => Object.fromEntries([["auto", "Tự động"], ...voices.map((v) => [v.voiceURI, v.name])]),
    [voices]
  );

  return (
    <>
      <section className="relative flex flex-wrap items-center gap-5 overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground sm:p-7">
        <span aria-hidden className="jp-serif pointer-events-none absolute -top-10 right-3 text-[220px] leading-none font-bold opacity-[0.08]">
          言
        </span>
        <span className="jp-serif flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-white/35 bg-gold-soft text-4xl font-bold text-gold-ink">
          学
        </span>
        <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-1">
          <h1 className="text-[28px] font-extrabold">Hồ sơ học tập</h1>
          <span className="text-[15px] opacity-85">
            Tiến trình ôn và cài đặt được lưu trên trình duyệt này. Xuất file để chuyển sang máy khác.
          </span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-1.5 rounded-2xl border border-border bg-card p-5">
            <span className="text-[13px] text-muted-foreground">{s.label}</span>
            <span className={cn("text-3xl font-extrabold", s.tone)}>{s.value}</span>
            <span className="text-[13px] text-muted-foreground">{s.sub}</span>
          </div>
        ))}
      </section>

      <section className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[3_1_480px] flex-col gap-6">
          <article className="flex flex-col gap-1.5 rounded-3xl border border-border bg-card p-5 sm:p-6">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <h2 className="text-[17px] font-bold">Bài học của bạn</h2>
              <Link href="/notebook" className="text-[13px] font-bold text-primary">
                Mở sổ từ
              </Link>
            </div>
            {lists.length === 0 && <p className="py-3 text-sm text-muted-foreground">Chưa có bài học nào trong CMS.</p>}
            {lists.map((l) => (
              <Link
                key={l.id}
                href={`/notebook?list=${l.id}`}
                className="flex min-h-14 items-center gap-3.5 border-t border-muted px-1 py-2 first-of-type:border-0"
              >
                <span className={cn("jp-serif flex size-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold", l.tone)}>
                  {l.glyph}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-[15px] font-bold">{l.name}</span>
                  <span className="text-[13px] text-muted-foreground">
                    {l.chapterName} · {l.words} từ · {l.sentences} câu
                  </span>
                </span>
                <ChevronRight className="size-[18px] text-muted-foreground" aria-hidden />
              </Link>
            ))}
          </article>

          <article className="flex flex-col gap-3.5 rounded-3xl border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-[17px] font-bold">Dữ liệu từ &amp; câu</h2>
              <span className="text-[13px] text-muted-foreground">
                Từ và câu nằm trong Strapi. Tiến trình ôn nằm trên trình duyệt — hãy xuất ra để sao lưu.
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <DataButton onClick={exportCsv} icon={<Download className="size-4" />}>
                Xuất từ vựng (CSV)
              </DataButton>
              <DataButton onClick={exportProgress} icon={<Download className="size-4" />}>
                Sao lưu tiến trình
              </DataButton>
              <DataButton onClick={() => fileRef.current?.click()} icon={<Upload className="size-4" />}>
                Khôi phục từ file
              </DataButton>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onImport(f);
                  e.target.value = "";
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!confirmReset) {
                  setConfirmReset(true);
                  return;
                }
                resetProgress();
                setConfirmReset(false);
                toast.success("Đã xoá tiến trình học.");
              }}
              onBlur={() => setConfirmReset(false)}
              className="min-h-11 w-fit rounded-xl border-[1.5px] border-vermilion/40 px-4 text-sm font-bold text-vermilion-ink hover:bg-vermilion-soft"
            >
              {confirmReset ? "Bấm lần nữa để xoá hẳn" : "Xoá tiến trình học"}
            </button>
          </article>
        </div>

        <article className="flex min-w-0 flex-[2_1_320px] flex-col gap-5 rounded-3xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-[17px] font-bold">Cài đặt học</h2>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Số từ mới mỗi ngày</span>
            <ToggleGroup
              aria-label="Số từ mới mỗi ngày"
              value={[String(settings.newPerDay)]}
              onValueChange={(v) => v[0] && updateSettings({ newPerDay: Number(v[0]) })}
              className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1"
            >
              {[3, 5, 10, 20].map((n) => (
                <ToggleGroupItem
                  key={n}
                  value={String(n)}
                  className="min-h-10 rounded-lg border-0 bg-transparent data-pressed:bg-card data-pressed:text-foreground data-pressed:shadow-sm"
                >
                  {n} từ
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="flex flex-col">
            <SettingRow
              label="Hiện romaji"
              sub="Nên tắt khi đã đọc được kana"
              checked={settings.showRomaji}
              onChange={(v) => updateSettings({ showRomaji: v })}
            />
            <SettingRow
              label="Tự phát âm khi lật thẻ"
              sub="Nghe ngay để nhớ cả âm"
              checked={settings.autoplay}
              onChange={(v) => updateSettings({ autoplay: v })}
            />
            <SettingRow
              label="Giảm chuyển động"
              sub="Tắt hiệu ứng lật, rung, nảy"
              checked={settings.reduceMotion}
              onChange={(v) => updateSettings({ reduceMotion: v })}
            />
            <SettingRow
              label="Giao diện tối"
              sub="Dịu mắt khi học buổi tối"
              checked={resolvedTheme === "dark"}
              onChange={(v) => setTheme(v ? "dark" : "light")}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-muted pt-4">
            <span className="text-sm font-semibold">Giọng đọc tiếng Nhật</span>
            {!ttsSupported ? (
              <p className="text-[13px] text-muted-foreground">Trình duyệt này không hỗ trợ đọc to.</p>
            ) : (
              <>
                <div className="flex gap-2.5">
                  <Select
                    value={settings.voiceURI ?? "auto"}
                    onValueChange={(v) => updateSettings({ voiceURI: v === "auto" ? null : (v as string) })}
                    items={voiceItems}
                  >
                    <SelectTrigger aria-label="Giọng đọc">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Tự động</SelectItem>
                      {voices.map((v) => (
                        <SelectItem key={v.voiceURI} value={v.voiceURI}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={() => speak("こんにちは。にほんごを べんきょう しましょう。")}
                    className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-indigo-soft px-3.5 text-sm font-bold text-primary"
                  >
                    <Play className="size-4" fill="currentColor" aria-hidden /> Nghe thử
                  </button>
                </div>
                {voices.length === 0 && (
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    Chưa thấy giọng tiếng Nhật trên máy. Cài thêm giọng “Japanese” trong cài đặt hệ điều hành để phát âm chuẩn hơn.
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span>Tốc độ đọc</span>
                    <span className="font-bold">{settings.rate.toFixed(1)}×</span>
                  </div>
                  <Slider
                    aria-label="Tốc độ đọc"
                    min={0.5}
                    max={1.3}
                    step={0.1}
                    value={settings.rate}
                    onValueChange={(v) => updateSettings({ rate: Array.isArray(v) ? v[0] : v })}
                  />
                </div>
              </>
            )}
          </div>
        </article>
      </section>
    </>
  );
}

function SettingRow({
  label,
  sub,
  checked,
  onChange,
}: {
  label: string;
  sub: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3.5 border-t border-muted py-3 first:border-0">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-semibold">{label}</span>
        <span className="text-[13px] text-muted-foreground">{sub}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} className="data-[size=default]:h-7 data-[size=default]:w-12 [&>span]:data-[size=default]:size-6" />
    </label>
  );
}

function DataButton({ onClick, icon, children }: { onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-12 flex-[1_1_170px] items-center justify-center gap-2 rounded-xl border-[1.5px] border-border bg-card px-3 text-sm font-bold hover:bg-muted"
    >
      {icon}
      {children}
    </button>
  );
}
