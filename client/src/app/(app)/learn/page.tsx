import type { Metadata } from "next";
import { LearnClient } from "@/components/pages/learn-client";
import { getLibrary } from "@/lib/strapi";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Học từ mới" };

export default async function LearnPage({ searchParams }: PageProps<"/learn">) {
  const { lesson } = await searchParams;
  const library = await getLibrary();
  return <LearnClient library={library} lessonId={typeof lesson === "string" ? lesson : null} />;
}
