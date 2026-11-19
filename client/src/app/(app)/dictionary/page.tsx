import type { Metadata } from "next";
import { DictionaryClient } from "@/components/pages/dictionary-client";
import { getLibrary } from "@/lib/strapi";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Từ điển" };

export default async function DictionaryPage({ searchParams }: PageProps<"/dictionary">) {
  const { q } = await searchParams;
  const library = await getLibrary();
  return <DictionaryClient library={library} initialQuery={typeof q === "string" ? q : ""} />;
}
