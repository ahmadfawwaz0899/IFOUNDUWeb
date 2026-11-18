"use client";

import Link from "next/link";
import {
  CircleHelp,
  FilePlus2,
  Hand,
  Home,
  Menu,
  ScanLine,
  Search,
  SearchX,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type MenuLink = { href: string; label: string; icon: LucideIcon };

const menuLinks: MenuLink[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search items", icon: Search },
  { href: "/scan", label: "Scan an item", icon: ScanLine },
  { href: "/report/found", label: "Report a found item", icon: FilePlus2 },
  { href: "/claims", label: "Claims", icon: Hand },
  { href: "/profile", label: "My profile", icon: UserRound },
];

const comingSoon: { label: string; icon: LucideIcon }[] = [
  { label: "Report a lost item", icon: SearchX },
  { label: "How IFoundU works", icon: CircleHelp },
];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-2">
        <Link
          href="/"
          aria-label="IFoundU home"
          className="rounded-xl px-2 py-1.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Logo />
        </Link>

        <div className="flex items-center">
          <Button
            variant="ghost"
            className="size-11 rounded-full [&_svg:not([class*='size-'])]:size-5"
            aria-label="Search items"
            nativeButton={false}
            render={<Link href="/search" />}
          >
            <Search />
          </Button>

          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  className="size-11 rounded-full [&_svg:not([class*='size-'])]:size-5"
                  aria-label="Open menu"
                />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="right" className="w-[82%] gap-0">
              <SheetHeader className="pt-5">
                <SheetTitle>
                  <Logo />
                </SheetTitle>
                <SheetDescription>
                  AI-powered lost &amp; found
                </SheetDescription>
              </SheetHeader>

              <nav aria-label="Main menu" className="flex flex-col px-2">
                {menuLinks.map(({ href, label, icon: Icon }) => (
                  <SheetClose
                    key={href}
                    nativeButton={false}
                    render={<Link href={href} />}
                    className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-[15px] font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
                    {label}
                  </SheetClose>
                ))}
              </nav>

              <Separator className="my-3" />

              <div className="flex flex-col px-2">
                <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Coming soon
                </p>
                {comingSoon.map(({ label, icon: Icon }) => (
                  <div
                    key={label}
                    aria-disabled="true"
                    className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-[15px] text-muted-foreground"
                  >
                    <Icon className="size-5" aria-hidden="true" />
                    <span className="flex-1">{label}</span>
                    <Badge variant="secondary">Soon</Badge>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
