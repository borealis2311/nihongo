"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { motion } from "motion/react";
import { FavoriteButton } from "@/components/study/favorite-button";
import { SpeakButton } from "@/components/study/speak-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { VocabItem, Word } from "@/lib/strapi";
import { jpText, matchesQuery, romajiOf } from "@/lib/text";
import { cn } from "@/lib/utils";

const PAGE = 30;

/** Chuyển Word của Strapi sang dạng dùng chung để tái sử dụng bộ lọc tìm kiếm. */
function toItem(w: Word): VocabItem {
  return {
    id: w.documentId,
    meaning: w.word,
    hiragana: w.hiragana,
    katakana: w.katakana,
    romaji: w.romaji,
    sentence: Boolean(w.sentence),
    order: w.order,
    createdAt: null,
    lessonId: null,
    lessonName: null,
    lessonSlug: null,
    chapterName: null,
    chapterSlug: null,
  };
}

export function LessonContent({ words, sentences }: { words: Word[]; sentences: Word[] }) {
  const [tab, setTab] = useState<"words" | "sentences">(words.length === 0 && sentences.length > 0 ? "sentences" : "words");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const wordItems = words.map(toItem).filter((w) => matchesQuery(w, query));
  const sentenceItems = sentences.map(toItem).filter((s) => matchesQuery(s, query));
  const visible = tab === "words" ? wordItems : sentenceItems;

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as "words" | "sentences")} className="gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-border">
        <TabsList variant="line" aria-label="Nội dung bài học" className="border-0">
          <TabsTrigger value="words">
            Từ vựng <Count active={tab === "words"}>{wordItems.length}</Count>
          </TabsTrigger>
          <TabsTrigger value="sentences">
            Mẫu câu <Count active={tab === "sentences"}>{sentenceItems.length}</Count>
          </TabsTrigger>
        </TabsList>
        <label className="mb-2 flex min-h-10 flex-[0_1_240px] items-center gap-2 rounded-xl border border-border bg-card px-3 text-muted-foreground focus-within:border-primary">
          <Search className="size-4 shrink-0" aria-hidden />
          <span className="sr-only">Lọc trong bài</span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
            placeholder="Lọc trong bài…"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none"
          />
        </label>
      </div>

      <TabsContent value="words">
        {wordItems.length === 0 ? (
          <Empty>{query ? "Không có từ nào khớp." : "Bài này chưa có từ vựng."}</Empty>
        ) : (
          <>
            {/* Bảng trên màn hình rộng */}
            <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
              <table className="w-full text-left">
                <thead className="bg-secondary text-xs font-bold tracking-wide text-muted-foreground uppercase">
                  <tr>
                    <th className="px-5 py-3">Tiếng Nhật</th>
                    <th className="px-4 py-3">Romaji</th>
                    <th className="px-4 py-3">Nghĩa</th>
                    <th className="w-32 px-4 py-3">
                      <span className="sr-only">Thao tác</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {wordItems.slice(0, limit).map((w) => (
                    <tr key={w.id} className="border-t border-muted transition-colors hover:bg-background/60">
                      <td className="px-5 py-3.5">
                        <span className="flex flex-col">
                          <span className="jp text-xl font-bold">{jpText(w)}</span>
                          {w.katakana && w.hiragana && w.katakana !== w.hiragana && (
                            <span className="jp text-xs text-muted-foreground">{w.katakana}</span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground italic">{romajiOf(w)}</td>
                      <td className="px-4 py-3.5 text-[15px] font-semibold">{w.meaning}</td>
                      <td className="px-4 py-3.5">
                        <span className="flex justify-end gap-2">
                          <FavoriteButton id={w.id} className="size-10" />
                          <SpeakButton text={jpText(w)} size="sm" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Thẻ trên mobile */}
            <div className="grid gap-3 md:hidden">
              {wordItems.slice(0, limit).map((w, i) => (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 10) * 0.02 }}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex flex-wrap items-baseline gap-2">
                      <span className="jp text-xl font-bold">{jpText(w)}</span>
                      <span className="text-[13px] text-muted-foreground">{romajiOf(w)}</span>
                    </span>
                    <span className="text-sm text-sidebar-foreground">{w.meaning}</span>
                  </div>
                  <FavoriteButton id={w.id} className="size-10" />
                  <SpeakButton text={jpText(w)} size="sm" />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </TabsContent>

      <TabsContent value="sentences">
        {sentenceItems.length === 0 ? (
          <Empty>{query ? "Không có câu nào khớp." : "Bài này chưa có mẫu câu."}</Empty>
        ) : (
          <div className="grid gap-3">
            {sentenceItems.slice(0, limit).map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 10) * 0.03 }}
                className="flex items-start gap-3.5 rounded-2xl border border-border bg-card px-5 py-4"
              >
                <span className="jp-serif mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-paper text-base font-bold text-gold-ink">
                  {i + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="jp text-lg leading-relaxed">{jpText(s)}</span>
                  <span className="text-[13px] text-muted-foreground italic">{romajiOf(s)}</span>
                  <span className="text-[15px] text-sidebar-foreground">{s.meaning}</span>
                </div>
                <div className="flex gap-2">
                  <FavoriteButton id={s.id} className="size-10" />
                  <SpeakButton text={jpText(s)} size="sm" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </TabsContent>

      {visible.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + PAGE)}
          className="min-h-11 rounded-xl border-[1.5px] border-border bg-card text-sm font-bold hover:bg-muted"
        >
          Xem thêm {Math.min(PAGE, visible.length - limit)} mục
        </button>
      )}
    </Tabs>
  );
}

function Count({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs", active ? "bg-indigo-soft text-indigo-ink" : "bg-muted text-muted-foreground")}>
      {children}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">{children}</div>
  );
}
