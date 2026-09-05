import { SiteHeader } from "@/components/docs/site-header";
import { SidebarNav } from "@/components/docs/sidebar-nav";
import { getChapters } from "@/lib/strapi";

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const chapters = await getChapters();

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <div className="flex flex-1 overflow-hidden">
        <SidebarNav chapters={chapters} />
        <main className="flex-1 overflow-y-auto px-10 py-14">
          <div className="mx-auto w-full max-w-3xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
