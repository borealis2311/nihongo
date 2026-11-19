import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Camera, ChevronRight, Lightbulb, Play } from "lucide-react";
import { LessonContent } from "@/components/docs/lesson-content";
import { flattenChapters, getChapters, getLesson, type Chapter } from "@/lib/strapi";
import { jpText } from "@/lib/text";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/docs/[chapter]/[lesson]">): Promise<Metadata> {
  const { chapter, lesson } = await params;
  const data = await getLesson(chapter, lesson).catch(() => null);
  return { title: data?.name ?? "Tài liệu" };
}

export default async function LessonPage({ params }: PageProps<"/docs/[chapter]/[lesson]">) {
  const { chapter: chapterSlug, lesson: lessonSlug } = await params;

  const [lesson, chapters] = await Promise.all([
    getLesson(chapterSlug, lessonSlug).catch(() => null),
    getChapters().catch((): Chapter[] => []),
  ]);
  if (!lesson) notFound();

  const flat = flattenChapters(chapters);
  const idx = flat.findIndex((f) => f.chapterSlug === chapterSlug && f.slug === lessonSlug);
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null;
  const lessonNumber =
    chapters.find((c) => c.slug === chapterSlug)?.lessons.findIndex((l) => l.slug === lessonSlug) ?? -1;

  const words = lesson.words.filter((w) => !w.sentence);
  const sentences = lesson.words.filter((w) => w.sentence);
  const glyph = (lesson.words.map((w) => jpText(w)).find(Boolean) ?? lesson.name).charAt(0);

  return (
    <>
      <nav aria-label="Vị trí" className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
        <Link href="/docs" className="font-semibold hover:text-foreground">
          Tài liệu
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span>{lesson.chapter?.name}</span>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-semibold text-foreground">{lesson.name}</span>
      </nav>

      <header className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-4">
          <span className="jp-serif flex size-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-soft text-[32px] font-bold text-indigo-ink">
            {glyph}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-xs font-extrabold tracking-wider text-gold-ink uppercase">
              {lesson.chapter?.name}
              {lessonNumber >= 0 ? ` · Bài ${lessonNumber + 1}` : ""}
            </span>
            <h1 className="text-[clamp(26px,3vw,34px)] leading-tight font-extrabold tracking-tight">{lesson.name}</h1>
            <span className="text-sm text-muted-foreground">
              {words.length} từ vựng · {sentences.length} mẫu câu
            </span>
          </div>
        </div>
        {lesson.intro && <p className="max-w-3xl text-base leading-relaxed text-sidebar-foreground">{lesson.intro}</p>}
        <div className="flex flex-wrap gap-2.5">
          <Link
            href={`/learn?lesson=${lesson.documentId}`}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-5 text-[15px] font-extrabold text-primary-foreground shadow-[0_4px_0_var(--indigo-ink)] transition-transform active:scale-[0.98]"
          >
            <Play className="size-4" fill="currentColor" aria-hidden /> Học bằng thẻ
          </Link>
          <Link
            href={`/import?lesson=${lesson.documentId}`}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl border-[1.5px] border-border px-5 text-[15px] font-bold hover:bg-muted"
          >
            <Camera className="size-4" aria-hidden /> Thêm từ ảnh vào bài này
          </Link>
        </div>
      </header>

      {lesson.tip && (
        <aside className="flex gap-3.5 rounded-2xl border border-paper-line bg-paper px-5 py-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold-ink">
            <Lightbulb className="size-5" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-extrabold text-gold-ink">Mẹo</span>
            <p className="text-sm leading-relaxed text-gold-ink/90">{lesson.tip}</p>
          </div>
        </aside>
      )}

      <LessonContent words={words} sentences={sentences} />

      <div className="grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/docs/${prev.chapterSlug}/${prev.slug}`}
            className="flex flex-col gap-1 rounded-2xl border border-border bg-card px-5 py-4 transition-colors hover:border-primary"
          >
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowLeft className="size-3.5" aria-hidden /> Bài trước
            </span>
            <span className="text-[15px] font-bold">{prev.name}</span>
          </Link>
        ) : (
          <span className="hidden sm:block" />
        )}
        {next && (
          <Link
            href={`/docs/${next.chapterSlug}/${next.slug}`}
            className="flex flex-col items-end gap-1 rounded-2xl border border-border bg-card px-5 py-4 text-right transition-colors hover:border-primary"
          >
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              Bài tiếp theo <ArrowRight className="size-3.5" aria-hidden />
            </span>
            <span className="text-[15px] font-bold">{next.name}</span>
          </Link>
        )}
      </div>
    </>
  );
}
