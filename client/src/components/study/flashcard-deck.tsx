"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Check, RotateCw, Sparkles } from "lucide-react";
import { Rating } from "ts-fsrs";
import { FavoriteButton } from "@/components/study/favorite-button";
import { SpeakButton } from "@/components/study/speak-button";
import { useSpeak } from "@/lib/speech";
import { useStudy } from "@/lib/study-store";
import type { VocabItem } from "@/lib/strapi";
import { jpText, romajiOf } from "@/lib/text";
import { cn } from "@/lib/utils";

interface FlashcardDeckProps {
  /** Danh sách thẻ của lượt học — được chụp lại khi component mount. */
  initialQueue: VocabItem[];
  title: string;
  subtitle?: string;
  emptyMessage?: string;
  onMore?: () => void;
  moreLabel?: string;
}

export function FlashcardDeck({
  initialQueue,
  title,
  subtitle,
  emptyMessage = "Không còn từ mới nào. Hãy thêm từ vào Strapi hoặc nhập từ ảnh.",
  onMore,
  moreLabel = "Học thêm 5 từ",
}: FlashcardDeckProps) {
  const [queue] = useState(initialQueue);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [againCount, setAgainCount] = useState(0);
  const grade = useStudy((s) => s.grade);
  const showRomaji = useStudy((s) => s.settings.showRomaji);
  const autoplay = useStudy((s) => s.settings.autoplay);
  const { speak } = useSpeak();

  const item = queue[index];
  const done = queue.length > 0 && index >= queue.length;

  const flip = () => {
    setFlipped((f) => {
      if (!f && autoplay && item) speak(jpText(item));
      return !f;
    });
  };

  const answer = (known: boolean) => {
    if (!item) return;
    grade(item.id, known ? Rating.Good : Rating.Again);
    if (!known) setAgainCount((c) => c + 1);
    setFlipped(false);
    setIndex((i) => i + 1);
  };

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[19px] font-extrabold">{title}</h2>
          {subtitle && <p className="text-[13px] text-muted-foreground">{subtitle}</p>}
        </div>
        {item && !done && (
          <span className="text-[13px] font-semibold text-muted-foreground">
            {index + 1} / {queue.length}
          </span>
        )}
      </div>

      {queue.length === 0 && (
        <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-2xl bg-muted/60 p-6 text-center">
          <Sparkles className="size-8 text-gold" aria-hidden />
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{emptyMessage}</p>
          {onMore && (
            <button
              type="button"
              onClick={onMore}
              className="min-h-11 rounded-xl border-[1.5px] border-border bg-card px-4 text-sm font-bold hover:bg-muted"
            >
              {moreLabel}
            </button>
          )}
        </div>
      )}

      {done && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-2xl bg-matcha-soft p-6 text-center"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-matcha text-white">
            <Check className="size-8" strokeWidth={3} aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-extrabold text-matcha-ink">
              Xong lượt này! <span className="jp">おつかれさま</span>
            </h3>
            <p className="text-sm text-matcha-ink">
              {againCount > 0
                ? `${againCount} từ “chưa nhớ” sẽ quay lại trong phần Ôn từ.`
                : "Các từ này đã được xếp lịch ôn."}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            <Link
              href="/review"
              className="inline-flex min-h-11 items-center rounded-xl bg-matcha px-5 text-sm font-bold text-white shadow-[0_4px_0_var(--matcha-ink)]"
            >
              Đi ôn từ
            </Link>
            {onMore && (
              <button
                type="button"
                onClick={onMore}
                className="min-h-11 rounded-xl border-[1.5px] border-matcha/40 bg-card px-4 text-sm font-bold text-matcha-ink"
              >
                {moreLabel}
              </button>
            )}
          </div>
        </motion.div>
      )}

      {item && !done && (
        <>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="[perspective:1200px]"
            >
              <button
                type="button"
                onClick={flip}
                aria-label={flipped ? "Lật lại mặt trước" : "Lật thẻ để xem nghĩa"}
                className="block w-full text-left"
              >
                <motion.div
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                  className="relative h-72 [transform-style:preserve-3d] sm:h-[300px]"
                >
                  <CardFront item={item} />
                  <CardBack item={item} showRomaji={showRomaji} />
                </motion.div>
              </button>
            </motion.div>
          </AnimatePresence>

          <div className="flex flex-wrap items-center gap-3">
            <SpeakButton text={jpText(item)} size="lg" />
            <FavoriteButton id={item.id} className="size-13 rounded-2xl" />
            <button
              type="button"
              onClick={() => answer(false)}
              className="min-h-13 flex-1 basis-32 rounded-2xl border-2 border-vermilion/40 bg-card text-[15px] font-extrabold text-vermilion-ink transition-transform active:scale-95"
            >
              Chưa nhớ
            </button>
            <button
              type="button"
              onClick={() => answer(true)}
              className="min-h-13 flex-1 basis-32 rounded-2xl bg-matcha text-[15px] font-extrabold text-white shadow-[0_4px_0_var(--matcha-ink)] transition-transform active:scale-95"
            >
              Đã nhớ
            </button>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Từ “Chưa nhớ” sẽ quay lại sớm trong phần Ôn từ. Bấm dấu trang để thêm vào Yêu thích.
          </p>
        </>
      )}
    </section>
  );
}

function CardFront({ item }: { item: VocabItem }) {
  const jp = jpText(item);
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-paper-line bg-paper p-6 [backface-visibility:hidden]">
      <span className="absolute top-4 left-4 rounded-lg bg-card px-2.5 py-1 text-xs font-bold text-gold-ink">
        {item.sentence ? "Mẫu câu" : "Từ vựng"}
      </span>
      {item.lessonName && (
        <span className="absolute top-4 right-4 max-w-[45%] truncate text-xs text-muted-foreground">{item.lessonName}</span>
      )}
      <span
        className={cn(
          "jp-serif text-center leading-snug font-bold break-words",
          item.sentence ? "text-[clamp(22px,3vw,32px)]" : jp.length > 6 ? "text-[clamp(36px,5vw,52px)]" : "text-[clamp(48px,7vw,72px)]"
        )}
      >
        {jp || "—"}
      </span>
      <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <RotateCw className="size-3.5" aria-hidden />
        Đoán nghĩa rồi chạm để lật
      </span>
    </div>
  );
}

function CardBack({ item, showRomaji }: { item: VocabItem; showRomaji: boolean }) {
  const jp = jpText(item);
  const showKatakana = item.katakana && item.hiragana && item.katakana !== item.hiragana && !item.sentence;
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-3 rounded-2xl bg-foreground p-6 text-background [backface-visibility:hidden] [transform:rotateY(180deg)] sm:px-8">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className={cn("jp font-bold", item.sentence ? "text-xl" : "text-[28px]")}>{jp}</span>
        {showRomaji && <span className="text-base opacity-75">{romajiOf(item)}</span>}
      </div>
      {showKatakana && (
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-gold-soft px-2.5 py-1 text-xs font-extrabold tracking-wide text-gold-ink">KATAKANA</span>
          <span className="jp text-lg font-bold">{item.katakana}</span>
        </div>
      )}
      <span className={cn("font-bold", item.sentence ? "text-lg" : "text-[22px]")}>{item.meaning}</span>
      {item.lessonName && (
        <span className="text-sm opacity-70">
          {item.chapterName ? `${item.chapterName} · ` : ""}
          {item.lessonName}
        </span>
      )}
    </div>
  );
}
