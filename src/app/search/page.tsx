import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "./search-view";

export const metadata: Metadata = { title: "Search items" };

export default function SearchPage() {
  return (
    // The search box reads ?q= and ?category= from the URL, which is only known at request time
    <Suspense fallback={<p className="py-10 text-center text-muted-foreground">Loading search…</p>}>
      <SearchView />
    </Suspense>
  );
}
