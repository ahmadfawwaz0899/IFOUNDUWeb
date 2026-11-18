import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { ItemPhoto } from "@/components/item-photo";
import { timeAgo, type Item } from "@/lib/items";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: Item["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold",
        status === "found" ? "bg-found-soft text-found" : "bg-lost-soft text-lost"
      )}
    >
      {status === "found" ? "Found" : "Lost"}
    </span>
  );
}

export function ItemCard({ item }: { item: Item }) {
  return (
    <Link
      href={`/items/${item.id}`}
      className="flex gap-3 rounded-2xl border bg-card p-3 text-card-foreground outline-none transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted"
    >
      <ItemPhoto
        path={item.photo_path}
        category={item.category}
        title={item.title}
        sensitive={item.is_sensitive}
        sizes="64px"
        className="size-16 shrink-0 rounded-xl"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold leading-6">{item.title}</h3>
          <StatusBadge status={item.status} />
        </div>
        {item.description && (
          <p className="line-clamp-1 text-sm text-muted-foreground">{item.description}</p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.location_name}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" />
            {timeAgo(item.happened_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}
