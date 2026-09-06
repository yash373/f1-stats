import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { MotionProvider } from "@/lib/motion";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  metadataBase: new URL("https://f1-stats.vercel.app"),
  title: {
    default: "F1 Dashboard — Driver & Team Stats",
    template: "%s · F1 Dashboard",
  },
  description:
    "Unofficial Formula 1 stats for geeks: standings, results, head-to-head, telemetry, race pace, pit stops and live timing.",
  openGraph: {
    title: "F1 Dashboard — Driver & Team Stats",
    description:
      "Unofficial Formula 1 stats for geeks: standings, results, telemetry, race pace and live timing.",
    type: "website",
  },
  twitter: { card: "summary", title: "F1 Dashboard", description: "Unofficial F1 stats for geeks." },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // `dark` is hardcoded while the theme is forced dark-only: first paint is
  // correct with zero JS, and next-themes keeps it in sync afterwards.
  // Remove when the light-mode rebuild reintroduces the toggle.
  return (
    <html lang="en" suppressHydrationWarning className="dark h-full">
      <body className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
        <ThemeProvider>
          <MotionProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 p-6">{children}</main>
          </div>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
