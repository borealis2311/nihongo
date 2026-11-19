"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EmptyLibrary } from "@/components/app/empty-library";
import { PageHeader } from "@/components/app/page-header";
import { FlashcardDeck } from "@/components/study/flashcard-deck";
import { useStudy, useStudyHydrated } from "@/lib/study-store";
import type { Library } from "@/lib/strapi";

export function LearnClient({ library, lessonId }: { library: Library; lessonId: string | null }) {
  const { items, lessons, error } = library;
  const hydrated = useStudyHydrated();
  const cards = useStudy((s) => s.cards);
  const [round, setRound] = useState(0);

  const lesson = lessons.find((l) => l.id === lessonId) ?? null;
  const pool = useMemo(() => items.filter((i) => (lesson ? i.lessonId === lesson.id : !i.sentence)), [items, lesson]);

  if (items.length === 0) return <EmptyLibrary error={error} />;

  return (
    <>
      <Link href="/topics" className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-primary">
        <ArrowLeft className="size-4" aria-hidden /> Chủ đề
      </Link>
      <PageHeader
        title={lesson ? `Học: ${lesson.name}` : "Học từ mới"}
        description={lesson ? `${lesson.chapterName} · mỗi lượt 10 thẻ, gồm cả từ và mẫu câu chưa học` : "Mỗi lượt 10 từ chưa học"}
      />
      <div className="max-w-3xl">
        {hydrated ? (
          <FlashcardDeck
            key={round}
            initialQueue={pool.filter((p) => !cards[p.id]).slice(0, 10)}
            title={lesson?.name ?? "Từ mới"}
            subtitle="Lật thẻ, rồi chọn Đã nhớ hoặc Chưa nhớ"
            emptyMessage="Bạn đã học hết thẻ trong bài này. Mở tài liệu bài học để xem lại toàn bộ nhé."
            onMore={pool.some((p) => !cards[p.id]) ? () => setRound((r) => r + 1) : undefined}
            moreLabel="Học tiếp 10 thẻ"
          />
        ) : (
          <div className="h-[460px] animate-pulse rounded-3xl bg-muted" />
        )}
      </div>
    </>
  );
}
