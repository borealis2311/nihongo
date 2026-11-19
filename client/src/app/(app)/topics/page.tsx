import type { Metadata } from "next";
import { TopicsClient } from "@/components/pages/topics-client";
import { getLibrary } from "@/lib/strapi";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Chủ đề" };

export default async function TopicsPage({ searchParams }: PageProps<"/topics">) {
  const { lesson } = await searchParams;
  const library = await getLibrary();
  return <TopicsClient library={library} initialLessonId={typeof lesson === "string" ? lesson : null} />;
}
