"use client";

import { MotionConfig } from "motion/react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useStudy } from "@/lib/study-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const reduceMotion = useStudy((s) => s.settings.reduceMotion);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <MotionConfig reducedMotion={reduceMotion ? "always" : "user"}>
        {children}
        <Toaster />
      </MotionConfig>
    </ThemeProvider>
  );
}
