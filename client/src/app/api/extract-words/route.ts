import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o";

const SYSTEM_PROMPT = `Bạn là trợ lý trích xuất từ vựng tiếng Nhật từ ảnh chụp (sách, vở, giáo trình).
Đọc ảnh và trả về danh sách các mục xuất hiện trong ảnh, theo đúng thứ tự xuất hiện.
Với mỗi mục:
- "word": Nghĩa của từ đó (Bằng tiếng Việt), không phải là tiếng Nhật (Hiragana hoặc Katakana, Kanji).
- "hiragana": cách đọc hiragana nếu có trong ảnh hoặc bạn suy ra chắc chắn được.
- "katakana": Từ word và hiragana, suy ra katakana.
- "romaji": phiên âm romaji.
- "sentence": true nếu mục này là một câu ví dụ (nhiều từ ghép thành câu/mệnh đề) thay vì một từ vựng đơn lẻ, ngược lại false.
Không bịa thêm nội dung không có trong ảnh. Nếu ảnh không chứa nội dung tiếng Nhật nào, trả về mảng rỗng.`;

interface ExtractedWord {
  word: string;
  hiragana: string;
  katakana: string;
  romaji: string;
  sentence: boolean;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Thiếu OPENAI_API_KEY trên server." }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu ảnh trong yêu cầu." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;

  let response: Response;
  try {
    response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Trích xuất từ vựng tiếng Nhật trong ảnh sau." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "extracted_words",
            strict: true,
            schema: {
              type: "object",
              properties: {
                words: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      word: { type: "string" },
                      hiragana: { type: "string" },
                      katakana: { type: "string" },
                      romaji: { type: "string" },
                      sentence: { type: "boolean" },
                    },
                    required: ["word", "hiragana", "katakana", "romaji", "sentence"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["words"],
              additionalProperties: false,
            },
          },
        },
      }),
    });
  } catch {
    return NextResponse.json({ error: "Không gọi được OpenAI. Kiểm tra kết nối mạng." }, { status: 502 });
  }

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json(
      { error: `OpenAI trả về lỗi (${response.status}): ${detail}` },
      { status: 502 }
    );
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;

  if (!content) {
    return NextResponse.json({ error: "Không nhận được nội dung từ OpenAI." }, { status: 502 });
  }

  let parsed: { words: ExtractedWord[] };
  try {
    parsed = JSON.parse(content);
  } catch {
    return NextResponse.json({ error: "Không phân tích được phản hồi JSON từ OpenAI." }, { status: 502 });
  }

  return NextResponse.json({ words: parsed.words ?? [] });
}
