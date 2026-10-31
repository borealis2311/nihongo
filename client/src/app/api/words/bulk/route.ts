import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const STRAPI_URL =
  process.env.STRAPI_URL ?? process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

interface WordInput {
  word: string;
  hiragana: string | null;
  katakana: string | null;
  romaji: string | null;
  sentence: boolean;
}

interface BulkRequestBody {
  lessonId?: string;
  words?: WordInput[];
}

export async function POST(request: NextRequest) {
  const token = process.env.STRAPI_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Thiếu STRAPI_API_TOKEN trên server." }, { status: 500 });
  }

  const body: BulkRequestBody = await request.json();
  const lessonId = body.lessonId;
  const words = Array.isArray(body.words) ? body.words : [];

  if (!lessonId) {
    return NextResponse.json({ error: "Thiếu bài học (lessonId)." }, { status: 400 });
  }
  if (words.length === 0) {
    return NextResponse.json({ error: "Không có từ nào để lưu." }, { status: 400 });
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  let nextOrder = 0;
  try {
    const orderRes = await fetch(
      `${STRAPI_URL}/api/words?filters[lesson][documentId][$eq]=${encodeURIComponent(lessonId)}` +
        "&sort=order:desc&pagination[pageSize]=1&fields[0]=order",
      { headers, cache: "no-store" }
    );
    if (orderRes.ok) {
      const orderJson = await orderRes.json();
      const maxOrder = orderJson?.data?.[0]?.order;
      if (typeof maxOrder === "number") nextOrder = maxOrder + 1;
    }
  } catch {
    // Nếu không lấy được order lớn nhất, cứ bắt đầu từ 0.
  }

  const errors: { index: number; word: string; error: string }[] = [];
  let createdCount = 0;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const wordText = w.word?.trim();

    if (!wordText) {
      errors.push({ index: i, word: w.word ?? "", error: "Thiếu nội dung từ." });
      continue;
    }

    try {
      const res = await fetch(`${STRAPI_URL}/api/words`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          data: {
            word: wordText,
            hiragana: w.hiragana?.trim() || null,
            katakana: w.katakana?.trim() || null,
            romaji: w.romaji?.trim() || null,
            sentence: Boolean(w.sentence),
            order: nextOrder + i,
            lesson: lessonId,
          },
        }),
      });

      if (res.ok) {
        createdCount += 1;
      } else {
        const detail = await res.text();
        errors.push({ index: i, word: wordText, error: `${res.status}: ${detail}` });
      }
    } catch (err) {
      errors.push({
        index: i,
        word: wordText,
        error: err instanceof Error ? err.message : "Lỗi không xác định.",
      });
    }
  }

  return NextResponse.json({ createdCount, errors });
}
