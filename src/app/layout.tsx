import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 블로그 코파일럿",
  description: "AI 기반 블로그 콘텐츠 전략 및 작성 도우미",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-surface text-on-surface">
        {children}
      </body>
    </html>
  );
}
