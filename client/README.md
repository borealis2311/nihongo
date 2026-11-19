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
| `/` | Trang chủ: tra nhanh (mở kết quả trong Tài liệu), thẻ “Từ mới hôm nay”, đoán nghĩa nhanh, nhập từ ảnh, chủ đề, câu mới thêm, từ yêu thích |
| `/topics` | Mỗi bài học trong CMS là một chủ đề; lọc theo chương, xem trước, học bằng thẻ, mở tài liệu hoặc thêm từ ảnh |
| `/learn?lesson=<id>` | Học thẻ chưa học của một bài (mở từ Chủ đề / Tài liệu) |
| `/docs` | Tài liệu: tổng quan chương – bài và tìm kiếm toàn bộ từ/câu (tiếng Việt có/không dấu, romaji, kana) |
| `/docs/[chapter]/[lesson]` | Trang bài học: giới thiệu, mẹo, tab Từ vựng / Mẫu câu, lọc trong bài, nghe phát âm, yêu thích, bài trước/sau |
| `/import` | Nhập từ ảnh 3 bước: chọn bài → gửi ảnh (QR điện thoại hoặc kéo thả) → kiểm tra, tự điền katakana/romaji, lưu vào Strapi |
| `/import/capture/[id]` | Trang chụp ảnh mở trên điện thoại sau khi quét QR |

## Thư viện chính

- **Tailwind CSS v4 + shadcn/ui (style `base-nova`, Base UI)** — component trong `src/components/ui`
- **motion** — lật thẻ, chuyển thẻ, hiệu ứng đúng/sai
- **ts-fsrs** — ghi nhận thẻ đã học / chưa học (FSRS)
- **zustand** (persist) — lưu thẻ đã học, yêu thích, cài đặt vào `localStorage` (khoá `nihongo-study`)
- **wanakana** — chuyển romaji ⇄ kana khi tìm kiếm và tự điền cách đọc khi nhập từ ảnh
- **Web Speech API** — đọc to tiếng Nhật (`speechSynthesis`), không cần API key
- **sonner** — thông báo

## Dữ liệu

- Trường `word` của Word trong Strapi là **nghĩa tiếng Việt**; chữ Nhật lấy từ `hiragana` (hoặc `katakana`), `sentence = true` là mẫu câu.
- Nhập từ ảnh gọi `POST /api/extract-words` (GPT-4o, cần `OPENAI_API_KEY`) rồi `POST /api/words/bulk` (cần `STRAPI_API_TOKEN` có quyền tạo Word).
- Thẻ đã học và yêu thích chỉ nằm trên trình duyệt hiện tại.
