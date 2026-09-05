import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/docs/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-border bg-sidebar px-8">
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 shrink-0 rounded-lg bg-primary" />
        <span className="text-base font-bold tracking-tight text-foreground">
          Nihongo Docs
        </span>
      </div>
      <div className="flex items-center gap-3.5">
        <div className="relative w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm kiếm tài liệu..."
            className="h-9 rounded-lg border-border bg-input pl-9 text-sm"
          />
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
