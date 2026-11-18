import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  Bell,
  ChevronRight,
  CircleHelp,
  HandHeart,
  LogOut,
  Mail,
  MessagesSquare,
  Search,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getMyItemCounts } from "@/lib/auth";
import { EditProfile } from "./edit-profile";

export const metadata: Metadata = { title: "Profile" };

const sections: { title: string; rows: { label: string; hint: string; icon: LucideIcon }[] }[] = [
  {
    title: "My activity",
    rows: [
      { label: "Items I found", hint: "Reports you posted", icon: HandHeart },
      { label: "Items I lost", hint: "What you're searching for", icon: Search },
      { label: "Claims & messages", hint: "Chats with finders and owners", icon: MessagesSquare },
    ],
  },
  {
    title: "More",
    rows: [
      { label: "Notifications", hint: "Match alerts and replies", icon: Bell },
      { label: "Privacy & safety", hint: "What others can see", icon: ShieldCheck },
      { label: "Help", hint: "How IFoundU works", icon: CircleHelp },
    ],
  },
];

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      {/* The account part reads the login cookie, so it loads in after the page shell */}
      <Suspense fallback={<AccountSkeleton />}>
        <Account />
      </Suspense>

      {sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-2">
          <h2 className="px-1 text-sm font-semibold text-muted-foreground">{section.title}</h2>
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
            {section.rows.map(({ label, hint, icon: Icon }) => (
              <li key={label} className="flex min-h-14 items-center gap-3 px-4 py-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <Icon className="size-[18px]" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{hint}</span>
                </span>
                <span className="text-xs text-muted-foreground">Soon</span>
                <ChevronRight className="size-4 text-muted-foreground/60" aria-hidden="true" />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

async function Account() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <>
        <section className="flex flex-col items-center gap-3 rounded-3xl border bg-card p-6 text-center">
          <Avatar className="size-20">
            <AvatarFallback className="bg-secondary text-2xl font-semibold text-secondary-foreground">
              G
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold">Guest</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to report items and get match alerts.
            </p>
          </div>
          <div className="flex w-full max-w-xs flex-col gap-2">
            <Button className="h-11 text-base" nativeButton={false} render={<Link href="/login" />}>
              Sign in
            </Button>
            <Button
              variant="outline"
              className="h-11 text-base"
              nativeButton={false}
              render={<Link href="/signup" />}
            >
              Create account
            </Button>
          </div>
        </section>
        <Stats found={0} lost={0} returned={0} />
      </>
    );
  }

  const counts = await getMyItemCounts(user.id);
  const name = user.fullName || user.email.split("@")[0];
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <>
      <section className="flex flex-col items-center gap-3 rounded-3xl border bg-card p-6 text-center">
        <Avatar className="size-20">
          <AvatarFallback className="bg-primary text-2xl font-semibold text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="text-xl font-bold">{name}</h1>
          <p className="inline-flex max-w-full items-center gap-1 text-sm text-muted-foreground">
            <Mail className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{user.email}</span>
          </p>
        </div>
      </section>

      <Stats {...counts} />

      <EditProfile
        fullName={user.fullName ?? ""}
        phone={user.phone ?? ""}
        preferred={user.preferred ?? ""}
      />

      <form action={signOut}>
        <Button type="submit" variant="outline" className="h-11 w-full text-base">
          <LogOut aria-hidden="true" /> Sign out
        </Button>
      </form>
    </>
  );
}

function Stats({ found, lost, returned }: { found: number; lost: number; returned: number }) {
  const stats = [
    { label: "Found", value: found, className: "text-found" },
    { label: "Lost", value: lost, className: "text-lost" },
    { label: "Returned", value: returned, className: "text-primary" },
  ];
  return (
    <section aria-label="Your stats" className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border bg-card p-3 text-center">
          <p className={`text-2xl font-bold tabular-nums ${s.className}`}>{s.value}</p>
          <p className="text-xs text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </section>
  );
}

function AccountSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 rounded-3xl border bg-card p-6">
        <div className="size-20 animate-pulse rounded-full bg-muted" />
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[74px] animate-pulse rounded-2xl border bg-card" />
        ))}
      </div>
    </div>
  );
}
