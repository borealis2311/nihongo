import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

const notoJp = Noto_Sans_JP({
  variable: "--font-noto-jp",
  weight: ["400", "500", "700"],
  preload: false,
});

const notoSerifJp = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  weight: ["600", "700"],
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "Nihongo Việt",
    template: "%s · Nihongo Việt",
  },
  description: "Lưu trữ và học từ vựng, mẫu câu tiếng Nhật cho người Việt.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4ee" },
    { media: "(prefers-color-scheme: dark)", color: "#12151a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${beVietnam.variable} ${notoJp.variable} ${notoSerifJp.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
