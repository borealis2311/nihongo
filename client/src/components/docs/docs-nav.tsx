"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookText, ChevronDown, ChevronRight } from "lucide-react";
import type { Chapter } from "@/lib/strapi";
import { cn } from "@/lib/utils";

/** Mục lục tài liệu: cột trái trên desktop, khối thu gọn trên mobile. */
export function DocsNav({ chapters }: { chapters: Chapter[] }) {
  const pathname = usePathname();
  const [, , activeChapter = "", activeLesson = ""] = pathname.split("/");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(chapters.map((c, i) => [c.slug, c.slug === activeChapter || (!activeChapter && i === 0)]))
  );

  const activeName = chapters
    .find((c) => c.slug === activeChapter)
    ?.lessons.find((l) => l.slug === activeLesson)?.name;

  return (
    <nav
      aria-label="Mục lục tài liệu"
      className="w-full shrink-0 rounded-2xl border border-border bg-card lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:w-64 lg:overflow-y-auto"
    >
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        aria-expanded={mobileOpen}
        className="flex min-h-13 w-full items-center gap-3 px-4 text-left lg:hidden"
      >
        <BookText className="size-5 text-primary" aria-hidden />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Mục lục</span>
          <span className="truncate text-sm font-bold">{activeName ?? "Chọn bài học"}</span>
        </span>
        <ChevronDown className={cn("size-5 text-muted-foreground transition-transform", mobileOpen && "rotate-180")} aria-hidden />
      </button>

      <div className={cn("flex-col gap-1 p-2.5 lg:flex", mobileOpen ? "flex border-t border-border lg:border-0" : "hidden")}>
        <Link
          href="/docs"
          className={cn(
            "flex min-h-10 items-center rounded-xl px-3 text-sm font-bold transition-colors",
            pathname === "/docs" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-muted"
          )}
          onClick={() => setMobileOpen(false)}
        >
          Tổng quan
        </Link>
        {chapters.map((chapter, ci) => {
          const isOpen = open[chapter.slug] ?? false;
          return (
            <div key={chapter.slug} className="flex flex-col">
              <button
                type="button"
                onClick={() => setOpen((s) => ({ ...s, [chapter.slug]: !isOpen }))}
                aria-expanded={isOpen}
                className="flex min-h-10 w-full items-center justify-between gap-2 rounded-xl px-3 text-left hover:bg-muted"
              >
                <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                  Chương {ci + 1} · {chapter.name}
                </span>
                <ChevronRight
                  className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-90")}
                  aria-hidden
                />
              </button>
              {isOpen && (
                <div className="mt-0.5 mb-2 ml-3 flex flex-col gap-0.5 border-l-2 border-border pl-2">
                  {chapter.lessons.map((lesson, li) => {
                    const active = chapter.slug === activeChapter && lesson.slug === activeLesson;
                    return (
                      <Link
                        key={lesson.slug}
                        href={`/docs/${chapter.slug}/${lesson.slug}`}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "rounded-lg px-3 py-2 text-[13.5px] leading-snug transition-colors",
                          active
                            ? "bg-sidebar-accent font-bold text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-muted"
                        )}
                      >
                        <span className="text-muted-foreground">Bài {li + 1}.</span> {lesson.name}
                      </Link>
                    );
                  })}
                  {chapter.lessons.length === 0 && <span className="px-3 py-2 text-xs text-muted-foreground">Chưa có bài</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
