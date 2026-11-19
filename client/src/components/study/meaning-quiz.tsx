"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { SpeakButton } from "@/components/study/speak-button";
import type { VocabItem } from "@/lib/strapi";
import { jpText, romajiOf, shuffle } from "@/lib/text";
import { cn } from "@/lib/utils";

interface Question {
  target: VocabItem;
  options: VocabItem[];
}

function makeQuestion(pool: VocabItem[], previousId?: string): Question | null {
  const candidates = pool.filter((p) => jpText(p) && p.meaning);
  if (candidates.length < 2) return null;
  const choices = candidates.filter((c) => c.id !== previousId);
  const target = choices[Math.floor(Math.random() * choices.length)];
  const distractors = shuffle(candidates.filter((c) => c.id !== target.id && c.meaning !== target.meaning)).slice(0, 3);
  return { target, options: shuffle([target, ...distractors]) };
}

/** Câu đố nhanh: nhìn chữ Nhật, chọn nghĩa đúng. Chỉ render phía client. */
export function MeaningQuiz({ pool }: { pool: VocabItem[] }) {
  const [question, setQuestion] = useState<Question | null>(() => makeQuestion(pool));
  const [picked, setPicked] = useState<string | null>(null);

  if (!question) return null;
  const { target, options } = question;
  const correct = picked === target.id;

  const next = () => {
    setPicked(null);
    setQuestion(makeQuestion(pool, target.id));
  };

  return (
    <section className="flex flex-col gap-3.5 rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[17px] font-bold">Đoán nghĩa nhanh</h2>
        <SpeakButton text={jpText(target)} size="sm" />
      </div>
      <div className="flex flex-col">
        <span className="jp-serif text-[34px] leading-tight font-bold">{jpText(target)}</span>
        <span className="text-[13px] text-muted-foreground">{romajiOf(target)} · nghĩa là gì?</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {options.map((o) => {
          const isTarget = o.id === target.id;
          const isPicked = o.id === picked;
          return (
            <motion.button
              key={o.id}
              type="button"
              disabled={picked !== null}
              onClick={() => setPicked(o.id)}
              animate={
                picked && isTarget ? { scale: [1, 1.06, 1] } : picked && isPicked ? { x: [0, -6, 6, -6, 6, 0] } : {}
              }
              transition={{ duration: 0.4 }}
              className={cn(
                "min-h-12 rounded-xl border-2 px-2 text-sm font-bold transition-[background-color,opacity] disabled:cursor-default",
                !picked && "border-border bg-card shadow-[0_3px_0_var(--border)] hover:bg-muted",
                picked && isTarget && "border-matcha bg-matcha-soft text-matcha-ink",
                picked && isPicked && !isTarget && "border-vermilion bg-vermilion-soft text-vermilion-ink",
                picked && !isTarget && !isPicked && "border-border opacity-45"
              )}
            >
              {o.meaning}
            </motion.button>
          );
        })}
      </div>
      {picked && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-semibold",
            correct ? "bg-matcha-soft text-matcha-ink" : "bg-vermilion-soft text-vermilion-ink"
          )}
        >
          {correct ? <Check className="size-5 shrink-0" strokeWidth={3} /> : <X className="size-5 shrink-0" strokeWidth={3} />}
          <span className="flex-1">
            {correct ? "Chính xác!" : "Chưa đúng —"} <span className="jp">{jpText(target)}</span> nghĩa là “{target.meaning}”.
          </span>
          <button
            type="button"
            onClick={next}
            className={cn(
              "min-h-9 shrink-0 rounded-lg px-3 text-[13px] font-bold text-white",
              correct ? "bg-matcha" : "bg-vermilion"
            )}
          >
            Câu khác
          </button>
        </motion.div>
      )}
    </section>
  );
}
