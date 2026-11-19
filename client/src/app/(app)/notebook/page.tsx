import type { Metadata } from "next";
import { NotebookClient } from "@/components/pages/notebook-client";
import { getLibrary } from "@/lib/strapi";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sổ từ của tôi" };

export default async function NotebookPage({ searchParams }: PageProps<"/notebook">) {
  const { list } = await searchParams;
  const library = await getLibrary();
  return <NotebookClient library={library} initialList={typeof list === "string" ? list : "all"} />;
}
