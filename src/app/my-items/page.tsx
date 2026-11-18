import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, Loader2, PackageOpen } from "lucide-react";
import { ItemCard } from "@/components/item-card";
import { getCurrentUser } from "@/lib/auth";
import { getMyItems } from "@/lib/claims-server";

export const metadata: Metadata = { title: "My items" };

export default function MyItemsPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold tracking-tight">Items I reported</h1>
      <Suspense
        fallback={
          <div className="flex justify-center py-16 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" aria-label="Loading your items" />
          </div>
        }
      >
        <MyItems />
      </Suspense>
    </div>
  );
}

async function MyItems() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/my-items");
  const items = await getMyItems(user.id);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-8 text-center">
        <PackageOpen className="size-10 text-muted-foreground" aria-hidden="true" />
        <p className="font-semibold">You haven&apos;t reported anything yet</p>
        <Link
          href="/report/found"
          className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-primary"
        >
          Report a found item <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  const active = items.filter((i) => !i.is_resolved);
  const returned = items.filter((i) => i.is_resolved);

  return (
    <>
      <ul className="flex flex-col gap-3">
        {active.map((item) => (
          <li key={item.id}>
            <ItemCard item={item} />
          </li>
        ))}
      </ul>
      {returned.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold text-muted-foreground">Returned ({returned.length})</h2>
          <ul className="flex flex-col gap-3 opacity-75">
            {returned.map((item) => (
              <li key={item.id}>
                <ItemCard item={item} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
