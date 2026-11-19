"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Camera, Search } from "lucide-react";
import { EmptyLibrary } from "@/components/app/empty-library";
import { FlashcardDeck } from "@/components/study/flashcard-deck";
import { MeaningQuiz } from "@/components/study/meaning-quiz";
import { SpeakButton } from "@/components/study/speak-button";
import { StatusBadge } from "@/components/study/status-badge";
import { lessonStats } from "@/lib/library";
import { isSameDay, statusOf, useStudy, useStudyHydrated } from "@/lib/study-store";
import type { Library } from "@/lib/strapi";
import { greeting, jpText } from "@/lib/text";
import { cn } from "@/lib/utils";

export function HomeClient({ library }: { library: Library }) {
  const { items, lessons, error } = library;
  const router = useRouter();
  const hydrated = useStudyHydrated();
  const cards = useStudy((s) => s.cards);
  const favorites = useStudy((s) => s.favorites);
  const newPerDay = useStudy((s) => s.settings.newPerDay);
  const [extra, setExtra] = useState(0);
  const [query, setQuery] = useState("");
  const hello = greeting();

  const words = useMemo(() => items.filter((i) => !i.sentence), [items]);
  const topics = useMemo(() => lessonStats(items, lessons).slice(0, 8), [items, lessons]);
  const recentSentences = useMemo(
    () =>
      items
        .filter((i) => i.sentence)
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
        .slice(0, 4),
    [items]
  );

  const favoriteItems = useMemo(
    () => (hydrated ? items.filter((i) => favorites[i.id]).slice(0, 4) : []),
    [items, favorites, hydrated]
  );

  const buildQueue = () => {
    const fresh = words.filter((w) => !cards[w.id]);
    if (extra > 0) return fresh.slice(0, 5);
    const today = new Date();
    const introducedToday = Object.values(cards).filter((c) => isSameDay(new Date(c.introducedAt), today)).length;
    return fresh.slice(0, Math.max(0, newPerDay - introducedToday));
  };

  if (items.length === 0) {
    return (
      <>
        <Header hello={hello} />
        <EmptyLibrary error={error} />
      </>
    );
  }

  return (
    <>
      <Header hello={hello} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/docs${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
        }}
        className="flex min-h-14 items-center gap-3 rounded-2xl border-[1.5px] border-border bg-card px-4 text-muted-foreground focus-within:border-primary focus-within:ring-4 focus-within:ring-indigo-soft"
      >
        <Search className="size-5 shrink-0" aria-hidden />
        <label htmlFor="home-search" className="sr-only">
          Tra từ vựng
        </label>
        <input
          id="home-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tra từ: gõ tiếng Việt, romaji hoặc kana (vd: “học sinh”, “gakusei”)"
          className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
        />
        <span className="hidden shrink-0 rounded-lg bg-muted px-2.5 py-1 text-xs font-bold sm:inline">Việt ⇄ Nhật</span>
      </form>

      <section className="flex flex-wrap items-start gap-6">
        <div className="min-w-0 flex-[3_1_460px]">
          {hydrated ? (
            <FlashcardDeck
              key={`daily-${extra}`}
              initialQueue={buildQueue()}
              title="Từ mới hôm nay"
              subtitle={`Mỗi ngày ${newPerDay} từ chưa học`}
              emptyMessage={
                words.some((w) => !cards[w.id])
                  ? "Bạn đã học đủ từ mới hôm nay. Muốn học tiếp?"
                  : "Bạn đã học hết từ trong thư viện. Thêm từ mới vào Strapi hoặc nhập từ ảnh."
              }
              onMore={words.some((w) => !cards[w.id]) ? () => setExtra((n) => n + 1) : undefined}
            />
          ) : (
            <div className="h-[460px] animate-pulse rounded-3xl bg-muted" />
          )}
        </div>

        <div className="flex min-w-0 flex-[2_1_300px] flex-col gap-6">
          <section className="flex flex-col gap-3.5 rounded-3xl bg-vermilion-soft p-5">
            <div className="flex items-center gap-3.5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-vermilion text-white">
                <Camera className="size-[22px]" aria-hidden />
              </span>
              <div className="flex flex-col">
                <h2 className="text-[17px] font-bold">Thêm từ mới từ ảnh</h2>
                <span className="text-[13px] text-vermilion-ink">Chụp trang sách, AI trích xuất rồi lưu vào bài học</span>
              </div>
            </div>
            <Link
              href="/import"
              className="flex min-h-12 items-center justify-center rounded-xl bg-vermilion text-[15px] font-extrabold text-white shadow-[0_4px_0_var(--vermilion-ink)]"
            >
              Nhập từ ảnh
            </Link>
          </section>

          {hydrated && words.length >= 2 && <MeaningQuiz pool={words} />}
        </div>
      </section>

      {topics.length > 0 && (
        <section className="flex flex-col gap-3.5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-[19px] font-extrabold">Học theo chủ đề</h2>
            <Link href="/topics" className="text-sm font-bold text-primary">
              Tất cả chủ đề
            </Link>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
            {topics.map((t) => (
              <Link
                key={t.id}
                href={`/topics?lesson=${t.id}`}
                className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(30,27,46,0.09)]"
              >
                <span className={cn("jp-serif flex size-13 shrink-0 items-center justify-center rounded-2xl text-[26px] font-bold", t.tone)}>
                  {t.glyph}
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-[15px] font-bold">{t.name}</span>
                  <span className="truncate text-[13px] text-muted-foreground">
                    {t.words} từ · {t.sentences} câu · {t.chapterName}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-wrap items-start gap-6">
        {recentSentences.length > 0 && (
          <div className="flex min-w-0 flex-[3_1_460px] flex-col gap-3 rounded-3xl border border-paper-line bg-paper p-5 sm:p-6">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-extrabold tracking-wider text-gold-ink uppercase">Mẫu câu</span>
              <h2 className="text-[19px] font-extrabold">Câu mới thêm gần đây</h2>
            </div>
            <ul className="flex flex-col gap-2.5">
              {recentSentences.map((s) => (
                <li key={s.id} className="flex items-center gap-3 rounded-2xl bg-card p-3.5">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="jp text-[17px] leading-relaxed">{jpText(s)}</span>
                    <span className="text-sm text-muted-foreground">{s.meaning}</span>
                  </div>
                  <SpeakButton text={jpText(s)} size="sm" />
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex min-w-0 flex-[2_1_300px] flex-col gap-2.5 rounded-3xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-[17px] font-bold">Từ yêu thích</h2>
            <span className="text-[13px] text-muted-foreground">{favoriteItems.length > 0 ? "Mới nhất" : ""}</span>
          </div>
          {favoriteItems.length === 0 ? (
            <p className="py-4 text-sm leading-relaxed text-muted-foreground">
              Bấm biểu tượng dấu trang ở thẻ từ hoặc trong từ điển để lưu từ bạn muốn xem lại.
            </p>
          ) : (
            <ul className="flex flex-col">
              {favoriteItems.map((f) => (
                <li key={f.id} className="flex items-center gap-3 border-b border-muted py-2.5 last:border-0">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="jp truncate text-lg font-bold">{jpText(f)}</span>
                    <span className="truncate text-[13px] text-sidebar-foreground">{f.meaning}</span>
                  </div>
                  <StatusBadge status={statusOf(cards[f.id])} />
                  <SpeakButton text={jpText(f)} size="sm" />
                </li>
              ))}
            </ul>
          )}
          <Link href="/docs" className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
            Mở tài liệu <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}

function Header({ hello }: { hello: { vi: string; jp: string } }) {
  return (
    <header className="flex flex-col gap-1">
      <h1 className="text-[clamp(24px,2.6vw,32px)] leading-tight font-extrabold tracking-tight" suppressHydrationWarning>
        {hello.vi}!
      </h1>
      <p className="text-[15px] text-muted-foreground" suppressHydrationWarning>
        <span className="jp" suppressHydrationWarning>{hello.jp}</span> · Hôm nay học vài từ mới nhé.
      </p>
    </header>
  );
}
