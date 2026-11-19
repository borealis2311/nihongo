import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { ImportClient } from "@/components/import-client";
import { getChapters, type Chapter } from "@/lib/strapi";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nhập từ ảnh" };

export default async function ImportPage({ searchParams }: PageProps<"/import">) {
  const { lesson } = await searchParams;
  let chapters: Chapter[] = [];
  let error: string | null = null;
  try {
    chapters = await getChapters();
  } catch (err) {
    error = err instanceof Error ? err.message : "Không kết nối được CMS.";
  }

  return (
    <>
      <PageHeader
        title="Nhập từ ảnh"
        description="Chụp trang sách hoặc vở, AI (GPT-4o) trích xuất từ vựng và mẫu câu, bạn kiểm tra lại rồi lưu thẳng vào bài học trên Strapi."
      />
      <ImportClient chapters={chapters} cmsError={error} initialLessonId={typeof lesson === "string" ? lesson : ""} />
    </>
  );
}
