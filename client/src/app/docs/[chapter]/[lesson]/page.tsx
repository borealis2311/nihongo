import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { WordTable } from "@/components/docs/word-table";
import { SentenceList } from "@/components/docs/sentence-list";
import { getChapters, getLesson, flattenChapters } from "@/lib/strapi";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ chapter: string; lesson: string }>;
}) {
  const { chapter: chapterSlug, lesson: lessonSlug } = await params;

  const [lesson, chapters] = await Promise.all([
    getLesson(chapterSlug, lessonSlug),
    getChapters(),
  ]);

  if (!lesson) notFound();

  const flat = flattenChapters(chapters);
  const idx = flat.findIndex(
    (f) => f.chapterSlug === chapterSlug && f.slug === lessonSlug
  );
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null;

  const tableWords = lesson.words.filter((w) => !w.sentence);
  const sentences = lesson.words.filter((w) => w.sentence);

  return (
    <div>
      <Breadcrumb className="mb-4.5">
        <BreadcrumbList>
          <BreadcrumbItem>Tài liệu</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{lesson.chapter?.name}</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{lesson.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="mb-3.5 text-[34px] leading-tight font-bold tracking-tight text-foreground">
        {lesson.name}
      </h1>
      {lesson.intro && (
        <p className="mb-6 max-w-2xl text-base leading-relaxed text-foreground">
          {lesson.intro}
        </p>
      )}

      {lesson.tip && (
        <div className="mb-9 flex gap-3 rounded-xl border-l-3 border-accent bg-tip px-5 py-4">
          <p className="text-[13px] leading-relaxed text-foreground">
            <strong className="text-accent">Mẹo — </strong>
            {lesson.tip}
          </p>
        </div>
      )}

      <WordTable words={tableWords} />
      <SentenceList sentences={sentences} />

      <div className="flex justify-between gap-4 border-t border-border pt-6">
        {prev ? (
          <Link
            href={`/docs/${prev.chapterSlug}/${prev.slug}`}
            className="flex-1 rounded-xl border border-border bg-card px-4.5 py-3.5 text-left transition-colors hover:border-primary"
          >
            <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowLeft className="h-3 w-3" /> Trước
            </div>
            <div className="text-sm font-semibold text-foreground">{prev.name}</div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {next && (
          <Link
            href={`/docs/${next.chapterSlug}/${next.slug}`}
            className="ml-auto flex-1 rounded-xl border border-border bg-card px-4.5 py-3.5 text-right transition-colors hover:border-primary"
          >
            <div className="mb-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
              Tiếp theo <ArrowRight className="h-3 w-3" />
            </div>
            <div className="text-sm font-semibold text-foreground">{next.name}</div>
          </Link>
        )}
      </div>
    </div>
  );
}
