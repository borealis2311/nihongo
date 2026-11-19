"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import { motion } from "motion/react";
import { EmptyLibrary } from "@/components/app/empty-library";
import { PageHeader } from "@/components/app/page-header";
import { SpeakButton } from "@/components/study/speak-button";
import { docsHref, lessonStats } from "@/lib/library";
import type { Library } from "@/lib/strapi";
import { jpText, matchesQuery, romajiOf } from "@/lib/text";
import { cn } from "@/lib/utils";

const MAX_RESULTS = 60;

export function DocsHome({ library, initialQuery }: { library: Library; initialQuery: string }) {
  const { items, lessons, error } = library;
  const [query, setQuery] = useState(initialQuery);
  const stats = useMemo(() => lessonStats(items, lessons), [items, lessons]);
  const chapters = useMemo(() => {
    const map = new Map<string, { name: string; slug: string; lessons: typeof stats }>();
    for (const l of stats) {
      const c = map.get(l.chapterSlug) ?? { name: l.chapterName, slug: l.chapterSlug, lessons: [] };
      c.lessons.push(l);
      map.set(l.chapterSlug, c);
    }
    return [...map.values()];
  }, [stats]);

  const trimmed = query.trim();
  const results = useMemo(() => (trimmed ? items.filter((i) => matchesQuery(i, trimmed)) : []), [items, trimmed]);

  const updateQuery = (value: string) => {
    setQuery(value);
    const url = value.trim() ? `/docs?q=${encodeURIComponent(value.trim())}` : "/docs";
    window.history.replaceState(null, "", url);
  };

  if (lessons.length === 0) {
    return (
      <>
        <PageHeader title="Tài liệu" />
        <EmptyLibrary error={error} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Tài liệu"
        description={`${chapters.length} chương · ${lessons.length} bài học · ${items.length} từ và mẫu câu`}
      />

      <div className="flex min-h-14 items-center gap-3 rounded-2xl border-[1.5px] border-border bg-card px-4 text-muted-foreground focus-within:border-primary focus-within:ring-4 focus-within:ring-indigo-soft">
        <Search className="size-5 shrink-0" aria-hidden />
        <label htmlFor="docs-search" className="sr-only">
          Tìm trong tài liệu
        </label>
        <input
          id="docs-search"
          type="search"
          value={query}
          onChange={(e) => updateQuery(e.target.value)}
          placeholder="Tìm từ, câu: tiếng Việt (có/không dấu), romaji hoặc kana"
          className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => updateQuery("")}
            aria-label="Xoá tìm kiếm"
            className="flex size-9 items-center justify-center rounded-lg hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {trimmed ? (
        <section className="flex flex-col gap-3">
          <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            {results.length} kết quả cho “{trimmed}”{results.length > MAX_RESULTS ? ` · hiện ${MAX_RESULTS}` : ""}
          </span>
          {results.slice(0, MAX_RESULTS).map((r, i) => {
            const href = docsHref(r);
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 12) * 0.02 }}
                className="flex items-center gap-3.5 rounded-2xl border border-border bg-card px-4 py-3.5"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                    <span className={cn("jp font-bold", r.sentence ? "text-[17px]" : "text-xl")}>{jpText(r)}</span>
                    <span className="text-[13px] text-muted-foreground">{romajiOf(r)}</span>
                  </span>
                  <span className="text-[15px] text-sidebar-foreground">{r.meaning}</span>
                  <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-md bg-muted px-2 py-0.5 font-bold">{r.sentence ? "Mẫu câu" : "Từ vựng"}</span>
                    {href && (
                      <Link href={href} className="font-semibold text-primary hover:underline">
                        {r.chapterName} · {r.lessonName}
                      </Link>
                    )}
                  </span>
                </div>
                <SpeakButton text={jpText(r)} size="sm" />
              </motion.div>
            );
          })}
          {results.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Không tìm thấy. Thử gõ không dấu, hoặc romaji như “gakkou”.
            </div>
          )}
        </section>
      ) : (
        chapters.map((chapter, ci) => (
          <section key={chapter.slug} className="flex flex-col gap-3.5">
            <div className="flex items-baseline gap-3">
              <span className="text-xs font-extrabold tracking-wider text-gold-ink uppercase">Chương {ci + 1}</span>
              <h2 className="text-[19px] font-extrabold">{chapter.name}</h2>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
              {chapter.lessons.map((l, li) => (
                <Link
                  key={l.id}
                  href={`/docs/${l.chapterSlug}/${l.slug}`}
                  className="group flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-4 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(30,27,46,0.09)]"
                >
                  <span className="flex items-center gap-3">
                    <span className={cn("jp-serif flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold", l.tone)}>
                      {l.glyph}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-xs text-muted-foreground">Bài {li + 1}</span>
                      <span className="truncate text-base font-bold">{l.name}</span>
                    </span>
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex gap-1.5">
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-sidebar-foreground">{l.words} từ</span>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-sidebar-foreground">{l.sentences} câu</span>
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}
