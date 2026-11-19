import type { Metadata } from "next";
import { DocsHome } from "@/components/docs/docs-home";
import { getLibrary } from "@/lib/strapi";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tài liệu" };

export default async function DocsIndexPage({ searchParams }: PageProps<"/docs">) {
  const { q } = await searchParams;
  const library = await getLibrary();
  return <DocsHome library={library} initialQuery={typeof q === "string" ? q : ""} />;
}
