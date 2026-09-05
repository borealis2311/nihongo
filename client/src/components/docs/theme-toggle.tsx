"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Chuyển giao diện sáng/tối"
      className="flex items-center gap-2 rounded-md p-1 cursor-pointer"
    >
      <span
        className="relative block h-[22px] w-10 rounded-full transition-colors"
        style={{ background: isDark ? "var(--primary)" : "#D6CBB8" }}
      >
        <span
          className="absolute top-[3px] block h-4 w-4 rounded-full bg-white shadow transition-[left] duration-200"
          style={{ left: isDark ? "21px" : "3px" }}
        />
      </span>
    </button>
  );
}
