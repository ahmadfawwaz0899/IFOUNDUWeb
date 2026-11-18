import type { Metadata } from "next";
import {
  Bell,
  ChevronRight,
  CircleHelp,
  HandHeart,
  MessagesSquare,
  Search,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Profile" };

const stats = [
  { label: "Found", value: 0, className: "text-found" },
  { label: "Lost", value: 0, className: "text-lost" },
  { label: "Returned", value: 0, className: "text-primary" },
];

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
    title: "Account",
    rows: [
      { label: "Notifications", hint: "Match alerts and replies", icon: Bell },
      { label: "Privacy & safety", hint: "What others can see", icon: ShieldCheck },
      { label: "Settings", hint: "Profile and contact details", icon: Settings },
      { label: "Help", hint: "How IFoundU works", icon: CircleHelp },
    ],
  },
];

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Who you are */}
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
        <Button className="h-11 w-full max-w-xs text-base" disabled>
          Sign in (coming soon)
        </Button>
      </section>

      {/* Stats */}
      <section aria-label="Your stats" className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-3 text-center">
            <p className={`text-2xl font-bold tabular-nums ${s.className}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </section>

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
