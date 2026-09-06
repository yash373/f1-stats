"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/live-timing", label: "Live Timing" },
  { href: "/schedule", label: "Schedule" },
  { href: "/results", label: "Results" },
  { href: "/driver-standings", label: "Driver Standings" },
  { href: "/constructor-standings", label: "Constructor Standings" },
  { href: "/drivers", label: "Drivers" },
  { href: "/teams", label: "Teams" },
  { href: "/driver-stats", label: "Driver Stats" },
  { href: "/head-to-head", label: "Head To Head" },
  { href: "/consistency", label: "Consistency" },
  { href: "/race-pace", label: "Race Pace" },
  { href: "/telemetry-lab", label: "Telemetry Lab" },
  { href: "/pit-stops", label: "Pit Stops" },
  { href: "/tech-updates", label: "Tech Updates" },
  { href: "/used-elements", label: "Used Elements" },
  { href: "/destructors-championship", label: "Destructors Championship" },
  { href: "/track-dna", label: "Track DNA" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Flag className="h-5 w-5 text-red-600" />
          <span>F1 Dashboard</span>
        </Link>
        {/* Theme toggle hidden until light mode is rebuilt (dark forced in theme-provider). */}
      </div>
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm",
                active
                  ? "bg-red-600/10 font-medium text-red-600"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <p className="px-4 py-3 text-xs text-zinc-500">
        Unofficial fan project. Data: Jolpica + OpenF1.
      </p>
    </aside>
  );
}
