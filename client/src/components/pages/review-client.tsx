"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Check, Headphones, Keyboard, Layers, ListChecks, X } from "lucide-react";
import { Rating, type Grade } from "ts-fsrs";
import { toHiragana } from "wanakana";
import { EmptyLibrary } from "@/components/app/empty-library";
import { PageHeader } from "@/components/app/page-header";
import { GradeButtons } from "@/components/study/grade-buttons";
import { SpeakButton } from "@/components/study/speak-button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSpeak } from "@/lib/speech";
import { GRADES, isDue, useStudy, useStudyHydrated, type StoredCard } from "@/lib/study-store";
import type { Library, VocabItem } from "@/lib/strapi";
import { isTypedAnswerCorrect, jpText, romajiOf, shuffle } from "@/lib/text";
import { cn } from "@/lib/utils";

type Mode = "flip" | "quiz" | "listen" | "type";

const MODES: { value: Mode; label: string; icon: typeof Layers }[] = [
  { value: "flip", label: "Lật thẻ", icon: Layers },
  { value: "quiz", label: "Trắc nghiệm", icon: ListChecks },
  { value: "listen", label: "Nghe", icon: Headphones },
  { value: "type", label: "Gõ kana", icon: Keyboard },
];

const SESSION_SIZE = 20;
const WEEKDAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

export function ReviewClient({ library, lessonId }: { library: Library; lessonId: string | null }) {
  const { items, lessons, error } = library;
  const hydrated = useStudyHydrated();
  const cards = useStudy((s) => s.cards);
  const [mode, setMode] = useState<Mode>("flip");
  const [round, setRound] = useState(0);
  const lesson = lessons.find((l) => l.id === lessonId) ?? null;
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const buildQueue = () => {
    const now = new Date();
    const pool = lesson
      ? items.filter((i) => i.lessonId === lesson.id && cards[i.id])
      : items.filter((i) => isDue(cards[i.id], now));
    return shuffle(pool).slice(0, SESSION_SIZE);
  };

  const dueCount = useMemo(() => {
    if (!hydrated) return 0;
    const now = new Date();
    return items.filter((i) => isDue(cards[i.id], now)).length;
  }, [items, cards, hydrated]);

  const forecast = useMemo(() => {
    if (!hydrated) return [];
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const counts = Array.from({ length: 7 }, () => 0);
    for (const [id, c] of Object.entries(cards)) {
      if (!byId.has(id)) continue;
      const day = Math.max(0, Math.floor((new Date(c.due).getTime() - start) / 86400000));
      if (day < counts.length) counts[day] += 1;
    }
    return counts.map((n, i) => {
      const day = new Date(start + i * 86400000);
      return { label: i === 0 ? "Hôm nay" : i === 1 ? "Ngày mai" : WEEKDAYS[day.getDay()], n };
    });
  }, [cards, byId, hydrated]);

  const leeches = useMemo(
    () =>
      hydrated
        ? Object.entries(cards)
            .filter(([id, c]) => c.lapses >= 3 && byId.has(id))
            .sort((a, b) => b[1].lapses - a[1].lapses)
            .slice(0, 5)
            .map(([id, c]) => ({ item: byId.get(id)!, lapses: c.lapses }))
        : [],
    [cards, byId, hydrated]
  );

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="Ôn từ" />
        <EmptyLibrary error={error} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={lesson ? `Ôn: ${lesson.name}` : "Ôn từ"}
        description={
          lesson
            ? "Ôn lại mọi thẻ đã học trong bài này."
            : hydrated
              ? `${dueCount} thẻ đến hạn hôm nay · mỗi lượt tối đa ${SESSION_SIZE} thẻ.`
              : "Đang tải lịch ôn…"
        }
        actions={
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList aria-label="Kiểu ôn" className="max-w-full flex-nowrap overflow-x-auto">
              {MODES.map((m) => (
                <TabsTrigger key={m.value} value={m.value}>
                  <m.icon aria-hidden />
                  {m.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />

      <section className="flex flex-wrap items-start gap-6">
        <div className="min-w-0 flex-[3_1_520px]">
          {hydrated ? (
            <ReviewSession
              key={`${round}-${lessonId ?? "due"}`}
              initialQueue={buildQueue()}
              pool={items}
              mode={mode}
              onRestart={() => setRound((r) => r + 1)}
              lessonMode={!!lesson}
            />
          ) : (
            <div className="h-[460px] animate-pulse rounded-3xl bg-muted" />
          )}
        </div>

        <div className="flex min-w-0 flex-[2_1_300px] flex-col gap-6">
          <section className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5">
            <h2 className="text-[17px] font-bold">Lịch ôn 7 ngày tới</h2>
            <ul className="flex flex-col">
              {forecast.map((f) => (
                <li key={f.label} className="flex items-center justify-between border-b border-muted py-2 text-sm last:border-0">
                  <span className="text-sidebar-foreground">{f.label}</span>
                  <span className="font-bold">{f.n} thẻ</span>
                </li>
              ))}
            </ul>
          </section>

          {leeches.length > 0 && (
            <section className="flex flex-col gap-3 rounded-3xl bg-vermilion-soft p-5">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-[17px] font-bold">Từ hay quên</h2>
                <span className="text-[13px] text-vermilion-ink">Quên từ 3 lần trở lên · nên ôn riêng</span>
              </div>
              {leeches.map(({ item, lapses }) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl bg-card px-3 py-2.5">
                  <span className="jp text-lg font-bold">{jpText(item)}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-sidebar-foreground">{item.meaning}</span>
                  <span className="text-xs font-bold text-vermilion-ink">{lapses} lần</span>
                </div>
              ))}
            </section>
          )}

          <section className="flex flex-col gap-1.5 rounded-3xl border border-paper-line bg-paper p-5">
            <span className="text-sm font-extrabold text-gold-ink">Ôn theo kiểu lặp lại ngắt quãng (FSRS)</span>
            <span className="text-[13px] leading-relaxed text-gold-ink/90">
              Càng nhớ dễ, lần ôn sau càng xa. Thẻ khó sẽ quay lại sớm hơn, nên bạn chỉ ôn đúng những thẻ sắp quên.
            </span>
          </section>
        </div>
      </section>
    </>
  );
}

function makeOptions(target: VocabItem | undefined, pool: VocabItem[]): VocabItem[] {
  if (!target) return [];
  const others = shuffle(
    pool.filter((p) => p.id !== target.id && p.sentence === target.sentence && p.meaning !== target.meaning)
  ).slice(0, 3);
  return shuffle([target, ...others]);
}

function ReviewSession({
  initialQueue,
  pool,
  mode,
  onRestart,
  lessonMode,
}: {
  initialQueue: VocabItem[];
  pool: VocabItem[];
  mode: Mode;
  onRestart: () => void;
  lessonMode: boolean;
}) {
  const [queue] = useState(initialQueue);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [typedResult, setTypedResult] = useState<boolean | null>(null);
  const [options, setOptions] = useState(() => makeOptions(initialQueue[0], pool));
  const [results, setResults] = useState<Grade[]>([]);
  const cards = useStudy((s) => s.cards);
  const grade = useStudy((s) => s.grade);
  const showRomaji = useStudy((s) => s.settings.showRomaji);
  const autoplay = useStudy((s) => s.settings.autoplay);
  const { speak } = useSpeak();

  const item = queue[index];
  const done = index >= queue.length;
  const card: StoredCard | undefined = item ? cards[item.id] : undefined;

  if (queue.length === 0) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-card p-8 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-matcha-soft text-matcha">
          <Check className="size-8" strokeWidth={3} aria-hidden />
        </span>
        <h2 className="text-xl font-extrabold">{lessonMode ? "Bài này chưa có thẻ nào đã học" : "Không có thẻ nào đến hạn"}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {lessonMode ? "Học thẻ mới của bài trước rồi quay lại ôn nhé." : "Bạn đã ôn hết. Học thêm vài từ mới ở trang chủ nhé."}
        </p>
        <Link href="/" className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground">
          Về trang chủ
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="flex min-h-96 flex-col items-center justify-center gap-4 rounded-3xl bg-matcha-soft p-8 text-center"
      >
        <span className="flex size-18 items-center justify-center rounded-full bg-matcha text-white">
          <Check className="size-9" strokeWidth={3} aria-hidden />
        </span>
        <h2 className="text-2xl font-extrabold text-matcha-ink">
          Xong lượt ôn! <span className="jp">おつかれさま</span>
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          {GRADES.map((g) => (
            <span key={g.rating} className="rounded-full bg-card px-3 py-1.5 text-[13px] font-bold">
              {g.label} · {results.filter((r) => r === g.rating).length}
            </span>
          ))}
        </div>
        <p className="text-sm text-matcha-ink">Thẻ chọn “Quên” sẽ quay lại ngay trong lượt sau.</p>
        <button
          type="button"
          onClick={onRestart}
          className="min-h-12 rounded-xl bg-matcha px-6 text-[15px] font-extrabold text-white shadow-[0_4px_0_var(--matcha-ink)]"
        >
          Ôn lượt tiếp theo
        </button>
      </motion.div>
    );
  }

  const correctPick = picked === item.id;
  const suggested: Grade | null =
    mode === "quiz" || mode === "listen"
      ? picked
        ? correctPick
          ? Rating.Good
          : Rating.Again
        : null
      : mode === "type" && typedResult !== null
        ? typedResult
          ? Rating.Good
          : Rating.Again
        : null;

  const onGrade = (rating: Grade) => {
    grade(item.id, rating);
    setResults((r) => [...r, rating]);
    const nextItem = queue[index + 1];
    setIndex((i) => i + 1);
    setRevealed(false);
    setPicked(null);
    setTyped("");
    setTypedResult(null);
    setOptions(makeOptions(nextItem, pool));
    if (nextItem && (mode === "listen" || autoplay)) speak(jpText(nextItem));
  };

  const jp = jpText(item);

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[15px] font-bold">{lessonMode ? "Ôn bài học" : "Lượt ôn hôm nay"}</span>
        <span className="text-[13px] text-muted-foreground">
          Thẻ {index + 1} / {queue.length}
        </span>
      </div>

      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-72 flex-col items-center justify-center gap-3.5 rounded-2xl border border-paper-line bg-paper p-6 text-center"
      >
        {mode === "listen" && !revealed ? (
          <button
            type="button"
            onClick={() => speak(jp)}
            className="flex size-24 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_0_var(--indigo-ink)] transition-transform active:scale-95"
            aria-label="Nghe lại"
          >
            <Headphones className="size-10" aria-hidden />
          </button>
        ) : mode === "type" && !revealed ? (
          <span className="text-[clamp(22px,3vw,30px)] font-extrabold">{item.meaning}</span>
        ) : (
          <span className={cn("jp-serif leading-tight font-bold break-words", item.sentence ? "text-[clamp(22px,3vw,32px)]" : "text-[clamp(48px,7vw,80px)]")}>
            {jp}
          </span>
        )}

        {!revealed && mode === "flip" && (
          <span className="text-sm text-muted-foreground">Nhớ nghĩa chưa? Nghĩ xong rồi bấm “Hiện đáp án”.</span>
        )}
        {!revealed && mode === "listen" && <span className="text-sm text-muted-foreground">Bấm để nghe, rồi chọn nghĩa đúng.</span>}
        {!revealed && mode === "type" && <span className="text-sm text-muted-foreground">Gõ cách đọc bằng romaji hoặc kana.</span>}

        {revealed && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2">
            {mode !== "flip" && mode !== "quiz" && (
              <span className={cn("jp font-bold", item.sentence ? "text-xl" : "text-3xl")}>{jp}</span>
            )}
            {showRomaji && <span className="text-base text-muted-foreground">{romajiOf(item)}</span>}
            <span className="text-xl font-bold">{item.meaning}</span>
            {item.lessonName && <span className="text-[13px] text-muted-foreground">{item.lessonName}</span>}
            <SpeakButton text={jp} />
          </motion.div>
        )}
      </motion.div>

      {(mode === "quiz" || mode === "listen") && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {options.map((o) => {
            const isTarget = o.id === item.id;
            const isPicked = o.id === picked;
            return (
              <motion.button
                key={o.id}
                type="button"
                disabled={!!picked}
                onClick={() => {
                  setPicked(o.id);
                  setRevealed(true);
                }}
                animate={picked && isTarget ? { scale: [1, 1.05, 1] } : picked && isPicked ? { x: [0, -6, 6, -6, 6, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={cn(
                  "flex min-h-13 items-center justify-center gap-2 rounded-2xl border-2 px-3 text-[15px] font-bold",
                  !picked && "border-border bg-card shadow-[0_3px_0_var(--border)] hover:bg-muted",
                  picked && isTarget && "border-matcha bg-matcha-soft text-matcha-ink",
                  picked && isPicked && !isTarget && "border-vermilion bg-vermilion-soft text-vermilion-ink",
                  picked && !isTarget && !isPicked && "border-border opacity-45"
                )}
              >
                {picked && isTarget && <Check className="size-4" strokeWidth={3} aria-hidden />}
                {picked && isPicked && !isTarget && <X className="size-4" strokeWidth={3} aria-hidden />}
                {o.meaning}
              </motion.button>
            );
          })}
        </div>
      )}

      {mode === "type" && !revealed && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!typed.trim()) return;
            setTypedResult(isTypedAnswerCorrect(typed, item));
            setRevealed(true);
          }}
          className="flex flex-col gap-2"
        >
          <label htmlFor="typed-answer" className="sr-only">
            Cách đọc
          </label>
          <div className="flex gap-2.5">
            <input
              id="typed-answer"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="vd: gakusei hoặc がくせい"
              className="jp min-h-13 min-w-0 flex-1 rounded-2xl border-[1.5px] border-border bg-card px-4 text-lg outline-none focus:border-primary focus:ring-4 focus:ring-indigo-soft"
            />
            <button type="submit" className="min-h-13 rounded-2xl bg-primary px-5 text-[15px] font-extrabold text-primary-foreground">
              Kiểm tra
            </button>
          </div>
          {typed && <span className="jp text-sm text-muted-foreground">→ {toHiragana(typed, { passRomaji: false })}</span>}
        </form>
      )}

      {mode === "type" && revealed && typedResult !== null && (
        <div
          role="status"
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold",
            typedResult ? "bg-matcha-soft text-matcha-ink" : "bg-vermilion-soft text-vermilion-ink"
          )}
        >
          {typedResult ? <Check className="size-5" strokeWidth={3} /> : <X className="size-5" strokeWidth={3} />}
          {typedResult ? "Chính xác!" : `Bạn gõ “${typed}”, đáp án là “${jp}”.`}
        </div>
      )}

      {mode === "flip" && !revealed && (
        <button
          type="button"
          onClick={() => {
            setRevealed(true);
            if (autoplay) speak(jp);
          }}
          className="min-h-14 rounded-2xl bg-primary text-base font-extrabold text-primary-foreground shadow-[0_4px_0_var(--indigo-ink)] transition-transform active:scale-[0.98]"
        >
          Hiện đáp án
        </button>
      )}

      {revealed && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2.5">
          <span className="text-center text-sm font-semibold text-sidebar-foreground">Bạn nhớ thẻ này thế nào?</span>
          <GradeButtons card={card} onGrade={onGrade} suggested={suggested} />
        </motion.div>
      )}
    </section>
  );
}
