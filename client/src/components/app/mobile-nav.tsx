"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/app/logo";
import { NAV_ITEMS, isActive } from "@/components/app/nav-items";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { cn } from "@/lib/utils";

/** Thanh trên cùng cho màn hình nhỏ. */
export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
      <Logo />
      <ThemeToggle />
    </header>
  );
}

/** Thanh tab dưới đáy cho màn hình nhỏ. */
export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-card/95 px-2 pt-2 pb-[max(env(safe-area-inset-bottom),12px)] backdrop-blur lg:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-[11px]",
              active ? "font-bold text-primary" : "font-medium text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                active && "bg-indigo-soft"
              )}
            >
              <Icon className="size-5" aria-hidden />
            </span>
            {item.short}
          </Link>
        );
      })}
    </nav>
  );
}
