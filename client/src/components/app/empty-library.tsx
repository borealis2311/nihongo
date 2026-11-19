import Link from "next/link";
import { Camera, DatabaseZap } from "lucide-react";

/** Trạng thái khi chưa có dữ liệu (CMS chưa chạy hoặc chưa có từ nào). */
export function EmptyLibrary({ error }: { error: string | null }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-indigo-soft text-primary">
        <DatabaseZap className="size-7" aria-hidden />
      </span>
      <div className="flex max-w-md flex-col gap-1.5">
        <h2 className="text-lg font-bold">{error ? "Chưa kết nối được CMS" : "Thư viện đang trống"}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {error
            ? "Kiểm tra Strapi đã chạy và biến STRAPI_URL / NEXT_PUBLIC_STRAPI_URL trong client/.env đúng địa chỉ."
            : "Thêm từ và mẫu câu vào một bài học trong Strapi, hoặc chụp ảnh trang sách để AI trích xuất giúp bạn."}
        </p>
        {error && <code className="mt-1 rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">{error}</code>}
      </div>
      <Link
        href="/import"
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
      >
        <Camera className="size-4" aria-hidden />
        Nhập từ ảnh
      </Link>
    </div>
  );
}
