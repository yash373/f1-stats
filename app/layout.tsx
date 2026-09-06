import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "F1 Dashboard — Driver & Team Stats",
  description:
    "Unofficial Formula 1 stats: standings, results, head-to-head, race pace, pit stops and live timing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
