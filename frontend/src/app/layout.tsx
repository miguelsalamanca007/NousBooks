import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "@/lib/query-client";
import ThemeApplier from "@/components/ThemeApplier";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "NousBooks",
  description: "Track your reading",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-amber-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <ThemeApplier />
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
