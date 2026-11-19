"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera } from "lucide-react";
import { ThemeToggle } from "@/components/docs/theme-toggle";
import { Logo } from "@/components/app/logo";
import { NAV_ITEMS, isActive } from "@/components/app/nav-items";
import { useDueCount } from "@/components/app/use-due-count";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const due = useDueCount();

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
      <Logo className="px-1" />
      <nav aria-label="Điều hướng chính" className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-[15px] transition-colors",
                active
                  ? "bg-sidebar-accent font-bold text-sidebar-accent-foreground"
                  : "font-medium text-sidebar-foreground hover:bg-muted"
              )}
            >
              <Icon className="size-5" aria-hidden />
              {item.label}
              {item.badge === "due" && due > 0 && (
                <span className="ml-auto flex h-[22px] min-w-6 items-center justify-center rounded-full bg-vermilion px-1.5 text-xs font-bold text-white">
                  {due}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-3">
        <Link
          href="/import"
          className="flex min-h-11 items-center gap-3 rounded-xl border-[1.5px] border-dashed border-border px-3.5 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-muted"
        >
          <Camera className="size-5" aria-hidden />
          Nhập từ ảnh
        </Link>
        <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
          Giao diện tối
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
