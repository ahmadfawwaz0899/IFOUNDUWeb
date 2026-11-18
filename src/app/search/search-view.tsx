"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Camera, Loader2, Search, SearchX } from "lucide-react";
import { ItemCard } from "@/components/item-card";
import { categories, type CategoryId } from "@/lib/categories";
import { ITEM_COLUMNS, type Item } from "@/lib/items";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function SearchView() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState<CategoryId | null>(
    (params.get("category") as CategoryId | null) ?? null
  );
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // Ask the database, waiting until the user pauses typing for 300 ms.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      let q = createClient()
        .from("items")
        .select(ITEM_COLUMNS)
        .eq("is_resolved", false)
        .order("created_at", { ascending: false })
        .limit(50);
      if (category) q = q.eq("category", category);

      // Every word must appear in the name, description or place.
      const words = query
        .replace(/[^\p{L}\p{N}\s-]/gu, " ") // drop symbols that would confuse the filter
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 6);
      for (const w of words) {
        q = q.or(`title.ilike.%${w}%,description.ilike.%${w}%,location_name.ilike.%${w}%`);
      }

      const { data, error } = await q;
      if (cancelled) return;
      setFailed(Boolean(error));
      setResults((data as Item[] | null) ?? []);
      setLoading(false);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, category]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Search items</h1>

      <div role="search" className="relative">
        <label htmlFor="search-q" className="sr-only">
          Search for an item
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          id="search-q"
          type="search"
          autoFocus={!params.get("category")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Item, colour, brand or place"
          className="h-12 w-full rounded-2xl border bg-card pr-4 pl-12 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <ul aria-label="Filter by category" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <li className="shrink-0">
          <FilterChip active={category === null} onClick={() => setCategory(null)}>
            All
          </FilterChip>
        </li>
        {categories.map(({ id, label, icon: Icon }) => (
          <li key={id} className="shrink-0">
            <FilterChip
              active={category === id}
              onClick={() => setCategory(category === id ? null : id)}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </FilterChip>
          </li>
        ))}
      </ul>

      <Link
        href="/scan"
        className="flex min-h-12 items-center gap-3 rounded-2xl border border-dashed border-primary/40 bg-secondary px-4 py-3 text-sm text-secondary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Camera className="size-5 shrink-0" aria-hidden="true" />
        <span>
          <span className="font-semibold">Have a photo?</span> Scan it and let AI find similar items.
        </span>
      </Link>

      <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Searching…
          </>
        ) : failed ? (
          "Couldn't load items. Check your connection and try again."
        ) : (
          `${results.length} ${results.length === 1 ? "item" : "items"}`
        )}
      </p>

      {loading && results.length === 0 ? null : results.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {results.map((item) => (
            <li key={item.id}>
              <ItemCard item={item} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <SearchX className="size-10 text-muted-foreground" aria-hidden="true" />
          <p className="font-semibold">No items match</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Try fewer words, another category, or scan a photo of your item.
          </p>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-card hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}
