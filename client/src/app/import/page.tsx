import { getChapters } from "@/lib/strapi";
import { ImportClient } from "@/components/import-client";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const chapters = await getChapters();

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-4">
      <div>
        <h1 className="font-heading text-lg font-semibold text-foreground">
          Nhập từ vựng từ ảnh
        </h1>
        <p className="text-sm text-muted-foreground">
          Chụp ảnh trang sách/vở bằng điện thoại, AI (GPT-4o) sẽ trích xuất từ vựng rồi đẩy thẳng
          lên Strapi.
        </p>
      </div>
      <ImportClient chapters={chapters} />
    </div>
  );
}
