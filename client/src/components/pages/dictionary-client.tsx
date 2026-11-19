"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BookText, Mic, MicOff, Search } from "lucide-react";
import { motion } from "motion/react";
import { EmptyLibrary } from "@/components/app/empty-library";
import { PageHeader } from "@/components/app/page-header";
import { FavoriteButton } from "@/components/study/favorite-button";
import { SpeakButton } from "@/components/study/speak-button";
import { StatusBadge } from "@/components/study/status-badge";
import { docsHref } from "@/lib/library";
import { useSpeechRecognition } from "@/lib/speech";
import { formatDueDay, statusOf, useStudy, useStudyHydrated } from "@/lib/study-store";
import type { Library, VocabItem } from "@/lib/strapi";
import { jpText, matchesQuery, normalizeKana, romajiOf } from "@/lib/text";
import { cn } from "@/lib/utils";

const MAX_RESULTS = 80;

export function DictionaryClient({ library, initialQuery }: { library: Library; initialQuery: string }) {
  const { items, error } = library;
  const [query, setQuery] = useState(initialQuery);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [voiceLang, setVoiceLang] = useState<"vi-VN" | "ja-JP">("vi-VN");
  const detailRef = useRef<HTMLDivElement>(null);
  const hydrated = useStudyHydrated();
  const cards = useStudy((s) => s.cards);

  const voice = useSpeechRecognition((text) => {
    setQuery(text);
    setSelectedId(null);
  });

  const matches = useMemo(() => items.filter((i) => matchesQuery(i, query)), [items, query]);
  const selected = matches.find((m) => m.id === selectedId) ?? matches[0] ?? null;

  const select = (id: string) => {
    setSelectedId(id);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="Từ điển" />
        <EmptyLibrary error={error} />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Từ điển" description={`Tra trong ${items.length} từ và mẫu câu bạn đã lưu.`} />

      <div className="flex flex-col gap-3">
        <div className="flex min-h-15 items-center gap-3 rounded-2xl border-2 border-primary bg-card px-4 text-primary ring-4 ring-indigo-soft">
          <Search className="size-[22px] shrink-0" aria-hidden />
          <label htmlFor="dict-search" className="sr-only">
            Tra từ
          </label>
          <input
            id="dict-search"
            type="search"
            autoFocus
            value={voice.listening && voice.interim ? voice.interim : query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedId(null);
            }}
            placeholder="Gõ tiếng Việt (có/không dấu), romaji hoặc kana"
            className="min-w-0 flex-1 bg-transparent text-[17px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          {voice.supported && (
            <>
              <button
                type="button"
                onClick={() => setVoiceLang((l) => (l === "vi-VN" ? "ja-JP" : "vi-VN"))}
                className="hidden min-h-9 shrink-0 rounded-lg bg-muted px-2.5 text-xs font-bold text-sidebar-foreground sm:block"
                title="Đổi ngôn ngữ nói"
              >
                {voiceLang === "vi-VN" ? "Nói: Tiếng Việt" : "Nói: 日本語"}
              </button>
              <button
                type="button"
                onClick={() => (voice.listening ? voice.stop() : voice.start(voiceLang))}
                aria-label={voice.listening ? "Dừng nghe" : "Tra bằng giọng nói"}
                aria-pressed={voice.listening}
                className={cn(
                  "relative flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                  voice.listening ? "bg-vermilion text-white" : "bg-indigo-soft text-primary hover:bg-primary hover:text-primary-foreground"
                )}
              >
                {voice.listening && (
                  <motion.span
                    className="absolute inset-0 rounded-xl bg-vermilion"
                    animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}
                {voice.listening ? <MicOff className="relative size-5" /> : <Mic className="relative size-5" />}
              </button>
            </>
          )}
        </div>
        {voice.error && <p className="text-sm text-vermilion-ink">{voice.error}</p>}
        {voice.supported && (
          <button
            type="button"
            onClick={() => setVoiceLang((l) => (l === "vi-VN" ? "ja-JP" : "vi-VN"))}
            className="w-fit text-xs font-semibold text-muted-foreground underline underline-offset-4 sm:hidden"
          >
            {voiceLang === "vi-VN" ? "Đang nói: Tiếng Việt (đổi sang tiếng Nhật)" : "Đang nói: Tiếng Nhật (đổi sang tiếng Việt)"}
          </button>
        )}
      </div>

      <section className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-0.5 rounded-2xl border border-border bg-card p-2.5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
          <span className="px-2.5 py-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
            {matches.length} kết quả{matches.length > MAX_RESULTS ? ` · hiện ${MAX_RESULTS}` : ""}
          </span>
          {matches.slice(0, MAX_RESULTS).map((r) => {
            const active = selected?.id === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => select(r.id)}
                aria-pressed={active}
                className={cn(
                  "flex min-h-16 w-full flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left transition-colors",
                  active ? "bg-indigo-soft shadow-[inset_3px_0_0_var(--primary)]" : "hover:bg-background"
                )}
              >
                <span className="flex flex-wrap items-baseline gap-2">
                  <span className={cn("jp font-bold", r.sentence ? "text-base" : "text-[19px]")}>{jpText(r)}</span>
                  {!r.sentence && <span className="text-[13px] text-muted-foreground">{romajiOf(r)}</span>}
                </span>
                <span className="text-[13px] text-sidebar-foreground">
                  {r.sentence ? "Mẫu câu · " : ""}
                  {r.meaning}
                </span>
              </button>
            );
          })}
          {matches.length === 0 && (
            <p className="px-3 py-6 text-center text-sm leading-relaxed text-muted-foreground">
              Chưa có từ khớp. Thử gõ không dấu, hoặc romaji như “gakkou”.
            </p>
          )}
        </div>

        <div ref={detailRef} className="min-w-0 flex-[3_1_480px] scroll-mt-20">
          {selected && (
            <WordDetail
              key={selected.id}
              item={selected}
              items={items}
              status={hydrated ? statusOf(cards[selected.id]) : null}
              dueLabel={hydrated && cards[selected.id] ? formatDueDay(cards[selected.id].due) : null}
              onSelect={select}
            />
          )}
        </div>
      </section>
    </>
  );
}

function WordDetail({
  item,
  items,
  status,
  dueLabel,
  onSelect,
}: {
  item: VocabItem;
  items: VocabItem[];
  status: ReturnType<typeof statusOf> | null;
  dueLabel: string | null;
  onSelect: (id: string) => void;
}) {
  const jp = jpText(item);
  const href = docsHref(item);
  const kana = normalizeKana(jp);

  const sentences = useMemo(
    () =>
      item.sentence || kana.length < 2
        ? []
        : items.filter((i) => i.sentence && normalizeKana(jpText(i)).includes(kana)).slice(0, 5),
    [items, item.sentence, kana]
  );
  const related = useMemo(
    () => items.filter((i) => i.lessonId && i.lessonId === item.lessonId && i.id !== item.id && !i.sentence).slice(0, 10),
    [items, item.id, item.lessonId]
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2.5">
          <span className={cn("jp-serif leading-snug font-bold break-words", item.sentence ? "text-[clamp(24px,3vw,34px)]" : "text-[clamp(44px,6vw,64px)]")}>
            {jp || "—"}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] text-muted-foreground">{romajiOf(item)}</span>
            {item.katakana && item.katakana !== item.hiragana && !item.sentence && (
              <span className="jp rounded-lg bg-gold-soft px-2.5 py-1 text-xs font-extrabold text-gold-ink">{item.katakana}</span>
            )}
            <span className="rounded-lg bg-indigo-soft px-2.5 py-1 text-xs font-bold text-indigo-ink">
              {item.sentence ? "Mẫu câu" : "Từ vựng"}
            </span>
            {status && <StatusBadge status={status} />}
            {dueLabel && <span className="text-xs text-muted-foreground">Ôn tiếp: {dueLabel}</span>}
          </div>
        </div>
        <div className="flex gap-2.5">
          <SpeakButton text={jp} size="lg" />
          <FavoriteButton id={item.id} withLabel />
        </div>
      </div>

      <DetailSection title="Nghĩa">
        <p className="text-lg font-semibold">{item.meaning}</p>
      </DetailSection>

      {item.lessonName && (
        <DetailSection title="Thuộc bài">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[15px]">
              {item.chapterName} · <span className="font-bold">{item.lessonName}</span>
            </span>
            {href && (
              <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                <BookText className="size-4" aria-hidden /> Mở tài liệu
              </Link>
            )}
          </div>
        </DetailSection>
      )}

      {sentences.length > 0 && (
        <DetailSection title="Câu có chứa từ này">
          <div className="flex flex-col gap-2.5">
            {sentences.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-background px-4 py-3.5">
                <button type="button" onClick={() => onSelect(s.id)} className="flex min-w-0 flex-1 flex-col gap-1 text-left">
                  <span className="jp text-[17px]">{jpText(s)}</span>
                  <span className="text-sm text-muted-foreground">{s.meaning}</span>
                </button>
                <SpeakButton text={jpText(s)} size="sm" className="bg-card" />
              </div>
            ))}
          </div>
        </DetailSection>
      )}

      {related.length > 0 && (
        <DetailSection title="Cùng bài học">
          <div className="flex flex-wrap gap-2">
            {related.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelect(r.id)}
                className="rounded-xl border-[1.5px] border-border px-3 py-2 text-sm transition-colors hover:border-primary"
              >
                <span className="jp font-bold">{jpText(r)}</span> <span className="text-muted-foreground">{r.meaning}</span>
              </button>
            ))}
          </div>
        </DetailSection>
      )}
    </motion.article>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-[13px] font-extrabold tracking-wider text-muted-foreground uppercase">{title}</h2>
      {children}
    </section>
  );
}
