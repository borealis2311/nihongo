// Trên server ưu tiên STRAPI_URL (URL nội bộ, vd. http://cms:1337 trong Docker).
const STRAPI_URL =
  (typeof window === "undefined" ? process.env.STRAPI_URL : undefined) ??
  process.env.NEXT_PUBLIC_STRAPI_URL ??
  "http://localhost:1337";

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

// ---------------------------------------------------------------------------
// Dữ liệu cho ứng dụng học: toàn bộ từ/câu kèm bài học và chương.
// ---------------------------------------------------------------------------

export interface VocabItem {
  /** documentId của Word trong Strapi, dùng làm khoá lưu tiến trình học. */
  id: string;
  /** Nghĩa tiếng Việt (trường `word` trong Strapi). */
  meaning: string;
  hiragana: string | null;
  katakana: string | null;
  romaji: string | null;
  sentence: boolean;
  order: number;
  createdAt: string | null;
  lessonId: string | null;
  lessonName: string | null;
  lessonSlug: string | null;
  chapterName: string | null;
  chapterSlug: string | null;
}

export interface LessonInfo {
  id: string;
  name: string;
  slug: string;
  order: number;
  chapterName: string;
  chapterSlug: string;
  chapterOrder: number;
}

export interface Library {
  items: VocabItem[];
  lessons: LessonInfo[];
  /** Thông báo lỗi khi không kết nối được CMS (null nếu ổn). */
  error: string | null;
}

interface RawWord extends Word {
  createdAt?: string;
  lesson?: {
    documentId: string;
    name: string;
    slug: string;
    chapter?: { name: string; slug: string } | null;
  } | null;
}

interface StrapiListResponse<T> {
  data: T[];
  meta?: { pagination?: { page: number; pageCount: number } };
}

async function fetchAllWords(): Promise<RawWord[]> {
  const base =
    "sort[0]=order:asc&sort[1]=id:asc" +
    "&populate[lesson][fields][0]=name" +
    "&populate[lesson][fields][1]=slug" +
    "&populate[lesson][populate][chapter][fields][0]=name" +
    "&populate[lesson][populate][chapter][fields][1]=slug" +
    "&pagination[pageSize]=100";

  const all: RawWord[] = [];
  let page = 1;
  let pageCount = 1;
  do {
    const res = await fetch(`${STRAPI_URL}/api/words?${base}&pagination[page]=${page}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Strapi request failed (${res.status}): /api/words`);
    const json = (await res.json()) as StrapiListResponse<RawWord>;
    all.push(...(json.data ?? []));
    pageCount = json.meta?.pagination?.pageCount ?? 1;
    page += 1;
  } while (page <= pageCount && page <= 50);

  return all;
}

/**
 * Lấy toàn bộ thư viện từ vựng. Không bao giờ ném lỗi: khi CMS không chạy,
 * trả về thư viện rỗng kèm `error` để giao diện hiển thị trạng thái trống.
 */
export async function getLibrary(): Promise<Library> {
  try {
    const [chapters, words] = await Promise.all([getChapters(), fetchAllWords()]);

    const lessons: LessonInfo[] = chapters.flatMap((chapter) =>
      chapter.lessons.map((lesson) => ({
        id: lesson.documentId,
        name: lesson.name,
        slug: lesson.slug,
        order: lesson.order,
        chapterName: chapter.name,
        chapterSlug: chapter.slug,
        chapterOrder: chapter.order,
      }))
    );
    const lessonIndex = new Map(lessons.map((l, i) => [l.id, i]));

    const items: VocabItem[] = words
      .map((w) => ({
        id: w.documentId,
        meaning: w.word,
        hiragana: w.hiragana,
        katakana: w.katakana,
        romaji: w.romaji,
        sentence: Boolean(w.sentence),
        order: w.order ?? 0,
        createdAt: w.createdAt ?? null,
        lessonId: w.lesson?.documentId ?? null,
        lessonName: w.lesson?.name ?? null,
        lessonSlug: w.lesson?.slug ?? null,
        chapterName: w.lesson?.chapter?.name ?? null,
        chapterSlug: w.lesson?.chapter?.slug ?? null,
      }))
      .sort((a, b) => {
        const la = a.lessonId ? lessonIndex.get(a.lessonId) ?? 9999 : 9999;
        const lb = b.lessonId ? lessonIndex.get(b.lessonId) ?? 9999 : 9999;
        return la - lb || a.order - b.order;
      });

    return { items, lessons, error: null };
  } catch (err) {
    return {
      items: [],
      lessons: [],
      error: err instanceof Error ? err.message : "Không kết nối được CMS.",
    };
  }
}
