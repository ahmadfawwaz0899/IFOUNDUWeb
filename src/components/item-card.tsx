import { Clock, MapPin } from "lucide-react";
import { getCategory } from "@/lib/categories";
import type { Item } from "@/lib/sample-items";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: Item["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold",
        status === "found" ? "bg-found-soft text-found" : "bg-lost-soft text-lost"
      )}
    >
      {status === "found" ? "Found" : "Lost"}
    </span>
  );
}

export function ItemCard({ item }: { item: Item }) {
  const { icon: Icon, label } = getCategory(item.category);

  return (
    <article className="flex gap-3 rounded-2xl border bg-card p-3 text-card-foreground">
      {/* Photo will go here once uploads exist; the category icon stands in for now */}
      <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
        <Icon className="size-7" role="img" aria-label={label} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold leading-6">{item.title}</h3>
          <StatusBadge status={item.status} />
        </div>
        <p className="line-clamp-1 text-sm text-muted-foreground">{item.description}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden="true" />
            {item.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" />
            {item.when}
          </span>
        </div>
      </div>
    </article>
  );
}
