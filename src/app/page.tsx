import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import { ArrowRight, Camera, PackageOpen, Search, SearchX } from "lucide-react";
import { ItemCard } from "@/components/item-card";
import { categories } from "@/lib/categories";
import { getRecentFoundItems, ITEMS_TAG } from "@/lib/items-server";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-7">
      {/* Greeting + search */}
      <section className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">
            Lost something? Found something?
          </h1>
          <p className="mt-1 text-muted-foreground">
            Search reported items or snap a photo and let AI find a match.
          </p>
        </div>

        <form action="/search" role="search" className="relative">
          <label htmlFor="home-search" className="sr-only">
            Search for an item
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="home-search"
            name="q"
            type="search"
            placeholder="Try “black iPhone” or “wallet”"
            className="h-12 w-full rounded-2xl border bg-card pr-4 pl-12 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </form>
      </section>

      {/* Two main actions */}
      <section aria-label="What would you like to do?" className="grid grid-cols-2 gap-3">
        <Link
          href="/search"
          className="group flex flex-col gap-3 rounded-2xl border bg-lost-soft p-4 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-lost text-white dark:text-black">
            <SearchX className="size-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-semibold">I lost something</span>
            <span className="text-sm text-muted-foreground">Search found items</span>
          </span>
        </Link>
        <Link
          href="/scan"
          className="group flex flex-col gap-3 rounded-2xl border bg-found-soft p-4 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-found text-white dark:text-black">
            <Camera className="size-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-semibold">I found something</span>
            <span className="text-sm text-muted-foreground">Snap and report it</span>
          </span>
        </Link>
      </section>

      {/* Categories */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Browse by category</h2>
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {categories.map(({ id, label, icon: Icon }) => (
            <li key={id} className="shrink-0">
              <Link
                href={`/search?category=${id}`}
                className="flex h-11 items-center gap-2 rounded-full border bg-card px-4 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Icon className="size-4 text-primary" aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Recently found */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recently found</h2>
          <Link
            href="/search"
            className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-medium text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            See all <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <RecentFound />
      </section>
    </div>
  );
}

/** Cached for a few minutes; refreshed instantly whenever an item is reported or deleted. */
async function RecentFound() {
  "use cache";
  cacheTag(ITEMS_TAG);
  cacheLife("minutes");

  const items = await getRecentFoundItems(4);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-8 text-center">
        <PackageOpen className="size-10 text-muted-foreground" aria-hidden="true" />
        <p className="font-semibold">No found items yet</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Found something? Be the first to report it and help someone get it back.
        </p>
        <Link
          href="/report/found"
          className="mt-1 inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Report a found item <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id}>
          <ItemCard item={item} />
        </li>
      ))}
    </ul>
  );
}
