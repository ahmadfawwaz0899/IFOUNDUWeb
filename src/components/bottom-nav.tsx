"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ScanLine, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

function NavShell({ children }: { children: React.ReactNode }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    >
      <div className="mx-auto grid h-16 w-full max-w-2xl grid-cols-3 items-center">
        {children}
      </div>
    </nav>
  );
}

const tabClass =
  "mx-auto flex min-h-12 min-w-16 flex-col items-center justify-center gap-0.5 rounded-xl px-3 text-xs font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50";

export function BottomNav() {
  return <NavItems pathname={usePathname()} />;
}

/** Same buttons with nothing highlighted, shown while the current page is worked out. */
export function BottomNavFallback() {
  return <NavItems pathname="" />;
}

function NavItems({ pathname }: { pathname: string }) {
  const isHome = pathname === "/";
  const isScan = pathname.startsWith("/scan");
  const isProfile = pathname.startsWith("/profile");

  return (
    <NavShell>
      <Link
        href="/"
        aria-current={isHome ? "page" : undefined}
        className={cn(
          tabClass,
          isHome ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Home className="size-6" strokeWidth={isHome ? 2.25 : 1.75} aria-hidden="true" />
        Home
      </Link>

      {/* Scan is the main action, so it gets a raised round button */}
      <Link
        href="/scan"
        aria-current={isScan ? "page" : undefined}
        className="group mx-auto -mt-7 flex flex-col items-center gap-1 rounded-full text-xs font-medium outline-none"
      >
        <span
          className={cn(
            "flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background transition-transform duration-150 group-active:scale-95 group-focus-visible:ring-ring/50",
            isScan && "bg-primary/90"
          )}
        >
          <ScanLine className="size-7" aria-hidden="true" />
        </span>
        <span className={isScan ? "text-primary" : "text-muted-foreground"}>
          Scan
        </span>
      </Link>

      <Link
        href="/profile"
        aria-current={isProfile ? "page" : undefined}
        className={cn(
          tabClass,
          isProfile ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <UserRound
          className="size-6"
          strokeWidth={isProfile ? 2.25 : 1.75}
          aria-hidden="true"
        />
        Profile
      </Link>
    </NavShell>
  );
}
