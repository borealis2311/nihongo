"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookText, Play } from "lucide-react";
import { motion } from "motion/react";
import { EmptyLibrary } from "@/components/app/empty-library";
import { PageHeader } from "@/components/app/page-header";
import { SpeakButton } from "@/components/study/speak-button";
import { StatusBadge } from "@/components/study/status-badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { lessonStats } from "@/lib/library";
import { statusOf, useStudy, useStudyHydrated } from "@/lib/study-store";
import type { Library } from "@/lib/strapi";
import { jpText } from "@/lib/text";
import { cn } from "@/lib/utils";

export function TopicsClient({ library, initialLessonId }: { library: Library; initialLessonId: string | null }) {
  const { items, lessons, error } = library;
  const hydrated = useStudyHydrated();
  const cards = useStudy((s) => s.cards);
  const stats = useMemo(() => lessonStats(items, lessons), [items, lessons]);
  const chapters = useMemo(() => {
    const seen = new Map<string, string>();
    for (const l of lessons) if (!seen.has(l.chapterSlug)) seen.set(l.chapterSlug, l.chapterName);
    return [...seen.entries()].map(([slug, name]) => ({ slug, name }));
  }, [lessons]);

  const [chapter, setChapter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialLessonId && lessons.some((l) => l.id === initialLessonId) ? initialLessonId : lessons[0]?.id ?? null
  );

  const visible = stats.filter((s) => chapter === "all" || s.chapterSlug === chapter);
  const selected = stats.find((s) => s.id === selectedId) ?? visible[0] ?? null;
  const preview = selected ? items.filter((i) => i.lessonId === selected.id) : [];
  const newCount = hydrated ? preview.filter((p) => !cards[p.id]).length : preview.length;

  if (lessons.length === 0) {
    return (
      <>
        <PageHeader title="Chủ đề từ vựng" />
        <EmptyLibrary error={error} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Chủ đề từ vựng"
        description="Mỗi bài học trong CMS là một chủ đề. Chọn để xem trước từ, rồi bấm học."
        actions={
          chapters.length > 1 ? (
            <ToggleGroup
              aria-label="Lọc theo chương"
              value={[chapter]}
              onValueChange={(v) => setChapter(v[0] ?? "all")}
            >
              <ToggleGroupItem value="all">Tất cả</ToggleGroupItem>
              {chapters.map((c) => (
                <ToggleGroupItem key={c.slug} value={c.slug}>
                  {c.name}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          ) : undefined
        }
      />

      <section className="flex flex-wrap items-start gap-6">
        <div className="grid min-w-0 flex-[3_1_520px] grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {visible.map((t, i) => {
            const active = selected?.id === t.id;
            return (
              <motion.button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                aria-pressed={active}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 10) * 0.03 }}
                className={cn(
                  "flex flex-col gap-3.5 rounded-2xl border-2 bg-card p-4 text-left transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(30,27,46,0.09)]",
                  active ? "border-primary ring-4 ring-indigo-soft" : "border-border"
                )}
              >
                <span className="flex items-center gap-3">
                  <span className={cn("jp-serif flex size-13 shrink-0 items-center justify-center rounded-2xl text-[26px] font-bold", t.tone)}>
                    {t.glyph}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-base font-bold">{t.name}</span>
                    <span className="truncate text-[13px] text-muted-foreground">{t.chapterName}</span>
                  </span>
                </span>
                <span className="flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-sidebar-foreground">{t.words} từ</span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-sidebar-foreground">{t.sentences} câu</span>
                </span>
              </motion.button>
            );
          })}
        </div>

        {selected && (
          <aside className="flex min-w-0 flex-[2_1_340px] flex-col gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6 lg:sticky lg:top-6">
            <div className="flex items-center gap-3.5">
              <span className={cn("jp-serif flex size-15 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold", selected.tone)}>
                {selected.glyph}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <h2 className="text-xl font-extrabold">{selected.name}</h2>
                <span className="text-[13px] text-muted-foreground">
                  {selected.words} từ · {selected.sentences} câu · {newCount} thẻ chưa học
                </span>
              </div>
            </div>

            <ul className="flex max-h-[420px] flex-col overflow-y-auto">
              {preview.slice(0, 30).map((w) => (
                <li key={w.id} className="flex items-center gap-3 border-b border-muted py-3 last:border-0">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={cn("jp font-bold break-words", w.sentence ? "text-base" : "text-[19px]")}>{jpText(w)}</span>
                    <span className="text-sm text-sidebar-foreground">{w.meaning}</span>
                  </div>
                  {hydrated && <StatusBadge status={statusOf(cards[w.id])} />}
                  <SpeakButton text={jpText(w)} size="sm" />
                </li>
              ))}
              {preview.length === 0 && <li className="py-6 text-sm text-muted-foreground">Bài này chưa có từ nào.</li>}
            </ul>

            <div className="flex flex-wrap gap-2.5">
              <Link
                href={`/learn?lesson=${selected.id}`}
                className="inline-flex min-h-12 flex-[2_1_180px] items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-extrabold text-primary-foreground shadow-[0_4px_0_var(--indigo-ink)]"
              >
                <Play className="size-4" fill="currentColor" aria-hidden /> Học thẻ chưa học
              </Link>
              <Link
                href={`/review?lesson=${selected.id}`}
                className="inline-flex min-h-12 flex-[1_1_120px] items-center justify-center rounded-xl border-[1.5px] border-border text-[15px] font-bold hover:bg-muted"
              >
                Ôn bài này
              </Link>
              <Link
                  href={`/docs/${selected.chapterSlug}/${selected.slug}`}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-primary hover:bg-indigo-soft"
                >
                  <BookText className="size-4" aria-hidden /> Xem tài liệu bài học
                </Link>
            </div>
          </aside>
        )}
      </section>
    </>
  );
}
