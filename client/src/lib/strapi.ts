const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

export interface Word {
  id: number;
  documentId: string;
  word: string;
  hiragana: string | null;
  katakana: string | null;
  romaji: string | null;
  sentence: boolean;
  order: number;
}

export interface LessonSummary {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  order: number;
}

export interface Lesson extends LessonSummary {
  intro: string | null;
  tip: string | null;
  words: Word[];
}

export interface Chapter {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  order: number;
  lessons: LessonSummary[];
}

export interface LessonWithChapter extends Lesson {
  chapter: { name: string; slug: string } | null;
}

async function strapiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${STRAPI_URL}${path}`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Strapi request failed (${res.status}): ${path}`);
  }

  const json = await res.json();
  return json.data as T;
}

export async function getChapters(): Promise<Chapter[]> {
  const query =
    "sort=order:asc" +
    "&populate[lessons][sort]=order:asc" +
    "&populate[lessons][fields][0]=name" +
    "&populate[lessons][fields][1]=slug" +
    "&populate[lessons][fields][2]=order" +
    "&fields[0]=name" +
    "&fields[1]=slug" +
    "&fields[2]=order" +
    "&pagination[pageSize]=100";

  return strapiFetch<Chapter[]>(`/api/chapters?${query}`);
}

export async function getLesson(
  chapterSlug: string,
  lessonSlug: string
): Promise<LessonWithChapter | null> {
  const query =
    `filters[slug][$eq]=${encodeURIComponent(lessonSlug)}` +
    `&filters[chapter][slug][$eq]=${encodeURIComponent(chapterSlug)}` +
    "&populate[words][sort]=order:asc" +
    "&populate[chapter][fields][0]=name" +
    "&populate[chapter][fields][1]=slug" +
    "&pagination[pageSize]=1";

  const results = await strapiFetch<LessonWithChapter[]>(`/api/lessons?${query}`);
  return results[0] ?? null;
}

export interface FlatLessonRef {
  chapterSlug: string;
  chapterName: string;
  slug: string;
  name: string;
}

export function flattenChapters(chapters: Chapter[]): FlatLessonRef[] {
  return chapters.flatMap((chapter) =>
    chapter.lessons.map((lesson) => ({
      chapterSlug: chapter.slug,
      chapterName: chapter.name,
      slug: lesson.slug,
      name: lesson.name,
    }))
  );
}
