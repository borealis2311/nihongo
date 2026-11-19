import { DocsNav } from "@/components/docs/docs-nav";
import { getChapters, type Chapter } from "@/lib/strapi";

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  let chapters: Chapter[] = [];
  try {
    chapters = await getChapters();
  } catch {
    // CMS chưa chạy: trang con sẽ hiển thị trạng thái trống.
  }

  return (
    <div className="flex flex-col items-start gap-6 lg:flex-row">
      {chapters.length > 0 && <DocsNav chapters={chapters} />}
      <div className="flex w-full min-w-0 flex-1 flex-col gap-6">{children}</div>
    </div>
  );
}
