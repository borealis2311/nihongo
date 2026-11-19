import type { Metadata } from "next";
import { ReviewClient } from "@/components/pages/review-client";
import { getLibrary } from "@/lib/strapi";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ôn từ" };

export default async function ReviewPage({ searchParams }: PageProps<"/review">) {
  const { lesson } = await searchParams;
  const library = await getLibrary();
  return <ReviewClient library={library} lessonId={typeof lesson === "string" ? lesson : null} />;
}
