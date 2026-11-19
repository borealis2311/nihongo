import { AppSidebar } from "@/components/app/app-sidebar";
import { MobileBottomNav, MobileTopBar } from "@/components/app/mobile-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main className="flex-1 px-4 pt-5 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
          <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6">{children}</div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
