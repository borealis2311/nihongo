"use client";

import { useState } from "react";
import Link from "next/link";
import { Camera, Play, Search } from "lucide-react";
import { motion } from "motion/react";
import { EmptyLibrary } from "@/components/app/empty-library";
import { PageHeader } from "@/components/app/page-header";
import { FavoriteButton } from "@/components/study/favorite-button";
import { QuickAdd } from "@/components/study/quick-add";
import { SpeakButton } from "@/components/study/speak-button";
import { StatusBadge } from "@/components/study/status-badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatDueDay, statusOf, useStudy, useStudyHydrated, type StudyStatus } from "@/lib/study-store";
import type { Library, VocabItem } from "@/lib/strapi";
import { jpText, matchesQuery, romajiOf } from "@/lib/text";
import { cn } from "@/lib/utils";

type Kind = "words" | "sentences";
type StatusFilter = "all" | StudyStatus;
const PAGE = 40;

export function NotebookClient({ library, initialList }: { library: Library; initialList: string }) {
  const { items, lessons, error } = library;
  const hydrated = useStudyHydrated();
  const cards = useStudy((s) => s.cards);
  const favorites = useStudy((s) => s.favorites);
  const showRomaji = useStudy((s) => s.settings.showRomaji);

  const [kind, setKind] = useState<Kind>("words");
  const [list, setList] = useState(initialList);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const inList = (i: VocabItem) =>
    list === "all" ? true : list === "favorites" ? hydrated && !!favorites[i.id] : i.lessonId === list;
  const statusOfItem = (i: VocabItem): StudyStatus => (hydrated ? statusOf(cards[i.id]) : "new");

  const scoped = items.filter((i) => inList(i) && matchesQuery(i, query));
  const words = scoped.filter((i) => !i.sentence);
  const sentences = scoped.filter((i) => i.sentence);
  const statusCounts: Record<StatusFilter, number> = { all: words.length, new: 0, learning: 0, known: 0 };
  for (const w of words) statusCounts[statusOfItem(w)] += 1;

  const rows = kind === "words" ? words.filter((w) => status === "all" || statusOfItem(w) === status) : sentences;
  const favoriteCount = hydrated ? items.filter((i) => favorites[i.id]).length : 0;

  if (items.length === 0 && lessons.length === 0) {
    return (
      <>
        <PageHeader title="Sổ từ của tôi" />
        <EmptyLibrary error={error} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Sổ từ của tôi"
        description="Nơi lưu từ và mẫu câu — từ bài học, ảnh chụp hay tự thêm. Mọi thẻ đã học đều tự vào lịch ôn."
        actions={
          <>
            <Link
              href="/import"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border-[1.5px] border-border bg-card px-4 text-[15px] font-bold hover:bg-muted"
            >
              <Camera className="size-4" aria-hidden /> Nhập từ ảnh
            </Link>
            <Link
              href={list !== "all" && list !== "favorites" ? `/review?lesson=${list}` : "/review"}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-4 text-[15px] font-extrabold text-primary-foreground shadow-[0_4px_0_var(--indigo-ink)]"
            >
              <Play className="size-4" fill="currentColor" aria-hidden /> Luyện các từ này
            </Link>
          </>
        }
      />

      <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)}>
        <TabsList variant="line" aria-label="Loại mục" className="w-full">
          <TabsTrigger value="words">
            Từ vựng <Count active={kind === "words"}>{words.length}</Count>
          </TabsTrigger>
          <TabsTrigger value="sentences">
            Mẫu câu <Count active={kind === "sentences"}>{sentences.length}</Count>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ToggleGroup
          aria-label="Danh sách"
          value={[list]}
          onValueChange={(v) => {
            setList(v[0] ?? "all");
            setLimit(PAGE);
          }}
          className="flex-nowrap sm:flex-wrap"
        >
          <ToggleGroupItem value="all">Tất cả</ToggleGroupItem>
          <ToggleGroupItem value="favorites">
            Yêu thích <span className="rounded-full bg-current/15 px-1.5 text-xs">{favoriteCount}</span>
          </ToggleGroupItem>
          {lessons.map((l) => (
            <ToggleGroupItem key={l.id} value={l.id}>
              {l.name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <section className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[3_1_520px] flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {kind === "words" ? (
              <Tabs value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
                <TabsList aria-label="Lọc theo mức nhớ">
                  {(
                    [
                      ["all", "Tất cả"],
                      ["new", "Chưa học"],
                      ["learning", "Đang nhớ"],
                      ["known", "Đã thuộc"],
                    ] as const
                  ).map(([value, label]) => (
                    <TabsTrigger key={value} value={value}>
                      {label} <span className="opacity-60">{statusCounts[value]}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            ) : (
              <span className="text-sm text-muted-foreground">Bấm vào câu để mở trong từ điển.</span>
            )}
            <label className="flex min-h-11 flex-[0_1_260px] items-center gap-2 rounded-xl border border-border bg-card px-3 text-muted-foreground focus-within:border-primary">
              <Search className="size-4 shrink-0" aria-hidden />
              <span className="sr-only">Tìm trong sổ</span>
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setLimit(PAGE);
                }}
                placeholder="Tìm trong sổ…"
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none"
              />
            </label>
          </div>

          {rows.slice(0, limit).map((item, i) =>
            item.sentence ? (
              <SentenceRow key={item.id} item={item} index={i} />
            ) : (
              <WordRow
                key={item.id}
                item={item}
                index={i}
                showRomaji={showRomaji}
                status={hydrated ? statusOf(cards[item.id]) : null}
                due={hydrated && cards[item.id] ? formatDueDay(cards[item.id].due) : null}
              />
            )
          )}

          {rows.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {list === "favorites"
                ? "Chưa có mục nào trong Yêu thích. Bấm dấu trang ở thẻ từ để thêm."
                : "Không có mục nào khớp bộ lọc này."}
            </div>
          )}
          {rows.length > limit && (
            <button
              type="button"
              onClick={() => setLimit((l) => l + PAGE)}
              className="min-h-11 rounded-xl border-[1.5px] border-border bg-card text-sm font-bold hover:bg-muted"
            >
              Xem thêm {Math.min(PAGE, rows.length - limit)} mục
            </button>
          )}
        </div>

        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-6 lg:sticky lg:top-6">
          <section id="quick-add" className="flex flex-col gap-3.5 rounded-3xl border border-border bg-card p-5">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-[17px] font-bold">Thêm nhanh</h2>
              <span className="text-[13px] text-muted-foreground">Cách đọc katakana & romaji được điền tự động.</span>
            </div>
            <QuickAdd key={kind} lessons={lessons} defaultSentence={kind === "sentences"} />
          </section>
          <section className="flex flex-col gap-1.5 rounded-3xl border border-paper-line bg-paper p-5">
            <span className="text-sm font-extrabold text-gold-ink">Mẹo lưu từ &amp; câu</span>
            <span className="text-[13px] leading-relaxed text-gold-ink/90">
              Gặp từ lạ trong phim, truyện hay ở chỗ làm? Lưu luôn cả câu bạn gặp — từ có ngữ cảnh riêng sẽ dễ nhớ hơn nhiều.
            </span>
          </section>
        </div>
      </section>
    </>
  );
}

function Count({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs",
        active ? "bg-indigo-soft text-indigo-ink" : "bg-muted text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}

function WordRow({
  item,
  index,
  showRomaji,
  status,
  due,
}: {
  item: VocabItem;
  index: number;
  showRomaji: boolean;
  status: StudyStatus | null;
  due: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.02 }}
      className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-border bg-card px-4 py-3.5 transition-shadow hover:shadow-[0_6px_18px_rgba(30,27,46,0.06)]"
    >
      <Link href={`/dictionary?q=${encodeURIComponent(jpText(item))}`} className="flex min-w-0 flex-[1_1_220px] flex-col gap-0.5">
        <span className="flex flex-wrap items-baseline gap-2">
          <span className="jp text-xl font-bold">{jpText(item)}</span>
          {showRomaji && <span className="text-[13px] text-muted-foreground">{romajiOf(item)}</span>}
        </span>
        <span className="text-sm text-sidebar-foreground">{item.meaning}</span>
      </Link>
      {status && <StatusBadge status={status} className="w-[84px] justify-center" />}
      <span className="flex w-24 flex-col">
        <span className="text-[11px] text-muted-foreground">{due ? "Ôn tiếp" : "Bài"}</span>
        <span className={cn("truncate text-sm font-bold", due === "Hôm nay" && "text-vermilion-ink")}>
          {due ?? item.lessonName ?? "—"}
        </span>
      </span>
      <div className="flex gap-2">
        <FavoriteButton id={item.id} className="size-10" />
        <SpeakButton text={jpText(item)} size="sm" />
      </div>
    </motion.div>
  );
}

function SentenceRow({ item, index }: { item: VocabItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.02 }}
      className="flex items-start gap-3.5 rounded-2xl border border-border bg-card px-4 py-4"
    >
      <Link href={`/dictionary?q=${encodeURIComponent(jpText(item))}`} className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="jp text-lg leading-relaxed">{jpText(item)}</span>
        <span className="text-[15px] text-sidebar-foreground">{item.meaning}</span>
        {item.lessonName && <span className="text-xs text-muted-foreground">{item.lessonName}</span>}
      </Link>
      <div className="flex gap-2">
        <FavoriteButton id={item.id} className="size-10" />
        <SpeakButton text={jpText(item)} size="sm" />
      </div>
    </motion.div>
  );
}
