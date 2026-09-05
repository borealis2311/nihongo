"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { Chapter } from "@/lib/strapi";
import { cn } from "@/lib/utils";

export function SidebarNav({ chapters }: { chapters: Chapter[] }) {
  const pathname = usePathname();
  const [, , activeChapterSlug = "", activeLessonSlug = ""] = pathname.split("/");

  const [openCats, setOpenCats] = useState<Record<string, boolean>>(() => ({
    [activeChapterSlug]: true,
  }));

  const toggle = (slug: string) =>
    setOpenCats((s) => ({ ...s, [slug]: !s[slug] }));

  return (
    <nav className="w-70 shrink-0 overflow-y-auto border-r border-sidebar-border bg-sidebar p-3">
      {chapters.map((chapter, ci) => {
        const isOpen = openCats[chapter.slug] ?? chapter.slug === activeChapterSlug;

        return (
          <div key={chapter.slug} className="mb-0.5">
            <button
              type="button"
              onClick={() => toggle(chapter.slug)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-sidebar-accent"
            >
              <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Chương {ci + 1}: {chapter.name}
              </span>
              <ChevronRight
                className={cn(
                  "h-3 w-3 shrink-0 text-muted-foreground transition-transform",
                  isOpen && "rotate-90"
                )}
              />
            </button>

            {isOpen && (
              <div className="mt-0.5 mb-2.5 ml-3 border-l border-sidebar-border pl-2">
                {chapter.lessons.map((lesson, li) => {
                  const isActive =
                    chapter.slug === activeChapterSlug && lesson.slug === activeLessonSlug;

                  return (
                    <Link
                      key={lesson.slug}
                      href={`/docs/${chapter.slug}/${lesson.slug}`}
                      className={cn(
                        "mb-0.5 block rounded-lg px-3 py-2 text-[13.5px] transition-colors",
                        isActive
                          ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                          : "font-normal text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      Bài {li + 1}: {lesson.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
