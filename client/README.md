# Nihongo Việt — client

Ứng dụng Next.js để lưu trữ và học từ vựng, mẫu câu tiếng Nhật. Nội dung (chương → bài học → từ/câu) nằm trong Strapi (`../cms`); tiến trình học cá nhân được lưu trên trình duyệt.

## Chạy thử

```bash
cp .env.example .env   # điền STRAPI_URL, STRAPI_API_TOKEN, OPENAI_API_KEY
npm install
npm run dev
```

Mở http://localhost:3000. Nếu Strapi chưa chạy, các trang vẫn mở được và hiện trạng thái “Chưa kết nối được CMS”.

## Các trang

| Đường dẫn | Nội dung |
| --- | --- |
| `/` | Trang chủ: tra nhanh, thẻ “Từ mới hôm nay”, số thẻ đến hạn, đoán nghĩa nhanh, chủ đề, câu mới thêm, từ yêu thích |
| `/topics` | Mỗi bài học trong CMS là một chủ đề; lọc theo chương, xem trước, học hoặc ôn theo bài |
| `/learn?lesson=<id>` | Học thẻ chưa học của một bài |
| `/review` | Ôn theo lịch FSRS với 4 kiểu: lật thẻ, trắc nghiệm, nghe, gõ kana |
| `/dictionary` | Tra theo tiếng Việt (có/không dấu), romaji hoặc kana; tra bằng giọng nói |
| `/notebook` | Sổ từ: tab Từ vựng / Mẫu câu, lọc theo bài, Yêu thích, mức nhớ; thêm nhanh vào Strapi |
| `/profile` | Thống kê, cài đặt (số từ mới/ngày, romaji, tự phát âm, giọng đọc, tốc độ, giảm chuyển động, giao diện tối), xuất CSV, sao lưu/khôi phục tiến trình |
| `/docs/...`, `/import` | Tài liệu bài học và nhập từ ảnh bằng GPT-4o (giữ nguyên như trước) |

## Thư viện chính

- **Tailwind CSS v4 + shadcn/ui (style `base-nova`, Base UI)** — component trong `src/components/ui`
- **motion** — lật thẻ, chuyển thẻ, hiệu ứng đúng/sai
- **ts-fsrs** — thuật toán lặp lại ngắt quãng cho phần Ôn từ
- **zustand** (persist) — lưu tiến trình học, yêu thích, cài đặt vào `localStorage` (khoá `nihongo-study`)
- **wanakana** — chuyển romaji ⇄ kana khi tra từ, gõ đáp án và thêm từ
- **Web Speech API** — đọc to tiếng Nhật (`speechSynthesis`) và tra từ bằng giọng nói (`SpeechRecognition`), không cần API key
- **sonner** — thông báo

## Dữ liệu

- Trường `word` của Word trong Strapi là **nghĩa tiếng Việt**; chữ Nhật lấy từ `hiragana` (hoặc `katakana`), `sentence = true` là mẫu câu.
- “Thêm nhanh” trong Sổ từ gọi route có sẵn `POST /api/words/bulk`, nên cần `STRAPI_API_TOKEN` có quyền tạo Word.
- Tiến trình ôn chỉ nằm trên trình duyệt hiện tại; dùng “Sao lưu tiến trình” ở trang Hồ sơ để chuyển sang máy khác.
