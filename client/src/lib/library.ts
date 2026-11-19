import type { LessonInfo, VocabItem } from "@/lib/strapi";
import { jpText } from "@/lib/text";

export interface LessonSummaryStats extends LessonInfo {
  words: number;
  sentences: number;
  glyph: string;
  tone: string;
}

export const TONES = [
  "bg-indigo-soft text-indigo-ink",
  "bg-vermilion-soft text-vermilion-ink",
  "bg-matcha-soft text-matcha-ink",
  "bg-paper text-gold-ink",
];

export function lessonStats(items: VocabItem[], lessons: LessonInfo[]): LessonSummaryStats[] {
  return lessons.map((lesson, i) => {
    const own = items.filter((it) => it.lessonId === lesson.id);
    const firstJp = own.map((o) => jpText(o)).find(Boolean) ?? "";
    return {
      ...lesson,
      words: own.filter((o) => !o.sentence).length,
      sentences: own.filter((o) => o.sentence).length,
      glyph: firstJp.charAt(0) || lesson.name.charAt(0).toUpperCase(),
      tone: TONES[i % TONES.length],
    };
  });
}

export function docsHref(item: { chapterSlug: string | null; lessonSlug: string | null }): string | null {
  return item.chapterSlug && item.lessonSlug ? `/docs/${item.chapterSlug}/${item.lessonSlug}` : null;
}
