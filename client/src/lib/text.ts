import { isRomaji, toHiragana, toKatakana, toRomaji } from "wanakana";
import type { VocabItem } from "@/lib/strapi";

/** Chữ tiếng Nhật để hiển thị: ưu tiên hiragana, sau đó katakana. */
export function jpText(item: Pick<VocabItem, "hiragana" | "katakana">): string {
  return item.hiragana?.trim() || item.katakana?.trim() || "";
}

/** Romaji: lấy từ CMS, nếu thiếu thì tự chuyển từ kana. */
export function romajiOf(item: Pick<VocabItem, "hiragana" | "katakana" | "romaji">): string {
  if (item.romaji?.trim()) return item.romaji.trim();
  const jp = jpText(item);
  return jp ? toRomaji(jp) : "";
}

/** Bỏ dấu tiếng Việt, viết thường, gộp khoảng trắng — dùng để so khớp tìm kiếm. */
export function normalizeVi(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();
}

/** Chuẩn hoá kana để so khớp: katakana → hiragana, bỏ khoảng trắng và dấu câu. */
export function normalizeKana(input: string): string {
  return toHiragana(input, { passRomaji: true })
    .replace(/[\s、。！？!?.,・「」]/g, "")
    .toLowerCase();
}

/**
 * Kiểm tra một mục có khớp chuỗi tìm kiếm không. Hỗ trợ:
 * - tiếng Việt có hoặc không dấu (so với nghĩa)
 * - romaji (so với romaji, và được chuyển sang kana để so với hiragana/katakana)
 * - hiragana / katakana
 */
export function matchesQuery(item: VocabItem, query: string): boolean {
  const q = query.trim();
  if (!q) return true;

  const qVi = normalizeVi(q);
  if (normalizeVi(item.meaning).includes(qVi)) return true;

  const romaji = normalizeVi(romajiOf(item)).replace(/\s/g, "");
  const qCompact = qVi.replace(/\s/g, "");
  if (romaji && romaji.includes(qCompact)) return true;

  const kana = normalizeKana(jpText(item));
  if (!kana) return false;
  const qKana = isRomaji(q.replace(/\s/g, "")) ? normalizeKana(toHiragana(q)) : normalizeKana(q);
  return qKana.length > 0 && kana.includes(qKana);
}

/** Tự điền cách đọc khi người dùng nhập romaji hoặc kana. */
export function readingsFrom(input: string): { hiragana: string; katakana: string; romaji: string } {
  const raw = input.trim();
  if (!raw) return { hiragana: "", katakana: "", romaji: "" };
  const hiragana = isRomaji(raw.replace(/\s/g, "")) ? toHiragana(raw) : toHiragana(raw, { passRomaji: true });
  return {
    hiragana,
    katakana: toKatakana(hiragana),
    romaji: toRomaji(raw),
  };
}

/** So khớp câu trả lời gõ (romaji hoặc kana) với đáp án. */
export function isTypedAnswerCorrect(answer: string, item: VocabItem): boolean {
  const target = normalizeKana(jpText(item));
  if (!target) return false;
  const typed = normalizeKana(isRomaji(answer.replace(/\s/g, "")) ? toHiragana(answer) : answer);
  return typed === target;
}

export function shuffle<T>(list: readonly T[]): T[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Lời chào theo giờ trong ngày. */
export function greeting(date = new Date()): { vi: string; jp: string } {
  const h = date.getHours();
  if (h < 11) return { vi: "Chào buổi sáng", jp: "おはよう" };
  if (h < 18) return { vi: "Chào buổi chiều", jp: "こんにちは" };
  return { vi: "Chào buổi tối", jp: "こんばんは" };
}
