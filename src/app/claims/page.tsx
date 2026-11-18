import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Inbox, Loader2, Send } from "lucide-react";
import { ItemPhoto } from "@/components/item-photo";
import { getCurrentUser } from "@/lib/auth";
import { getMyClaimLists } from "@/lib/claims-server";
import { timeAgo, type Item } from "@/lib/items";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Claims" };

export default function ClaimsPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold tracking-tight">Claims</h1>
      <Suspense
        fallback={
          <div className="flex justify-center py-16 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" aria-label="Loading claims" />
          </div>
        }
      >
        <ClaimLists />
      </Suspense>
    </div>
  );
}

async function ClaimLists() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/claims");
  const { incoming, outgoing } = await getMyClaimLists(user.id);

  return (
    <>
      <List
        title="On items you found"
        icon={Inbox}
        empty="No one has claimed your items yet."
        rows={incoming.map((c) => ({
          id: c.id,
          item: c.item,
          status: c.status,
          line: `${c.claimant?.full_name || "Someone"} · ${timeAgo(c.created_at)}`,
          action: c.status === "pending" && !c.item.is_resolved ? "Review" : undefined,
        }))}
      />
      <List
        title="Your claims"
        icon={Send}
        empty="You haven't claimed any items."
        rows={outgoing.map((c) => ({
          id: c.id,
          item: c.item,
          status: c.status,
          line: `Sent ${timeAgo(c.created_at)}`,
        }))}
      />
    </>
  );
}

type Row = {
  id: string;
  item: Pick<Item, "id" | "title" | "photo_path" | "category" | "is_sensitive" | "is_resolved">;
  status: "pending" | "approved" | "rejected";
  line: string;
  action?: string;
};

function List({
  title,
  icon: Icon,
  empty,
  rows,
}: {
  title: string;
  icon: typeof Inbox;
  empty: string;
  rows: Row[];
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-center gap-2 font-semibold">
        <Icon className="size-5 text-primary" aria-hidden="true" /> {title}
      </h2>
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/items/${r.item.id}`}
                className="flex min-h-16 items-center gap-3 px-3 py-2.5 outline-none hover:bg-muted/50 focus-visible:bg-muted"
              >
                <ItemPhoto
                  path={r.item.photo_path}
                  category={r.item.category}
                  title={r.item.title}
                  sensitive={r.item.is_sensitive}
                  sizes="48px"
                  className="size-12 shrink-0 rounded-lg"
                  iconClassName="size-5"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{r.item.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.line}</span>
                </span>
                {r.action ? (
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    {r.action}
                  </span>
                ) : (
                  <StatusPill status={r.item.is_resolved && r.status === "approved" ? "returned" : r.status} />
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StatusPill({ status }: { status: Row["status"] | "returned" }) {
  const map = {
    pending: ["Waiting", "bg-lost-soft text-lost"],
    approved: ["Approved", "bg-found-soft text-found"],
    rejected: ["Not approved", "bg-muted text-muted-foreground"],
    returned: ["Returned", "bg-secondary text-secondary-foreground"],
  } as const;
  const [label, className] = map[status];
  return (
    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold", className)}>
      {label}
    </span>
  );
}
