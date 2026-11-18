import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CalendarClock, CircleCheck, Loader2, MapPin, MessageCircleQuestion, Tag } from "lucide-react";
import { StatusBadge } from "@/components/item-card";
import { ItemPhoto } from "@/components/item-photo";
import { Button } from "@/components/ui/button";
import { getCategory } from "@/lib/categories";
import { formatDateTime, timeAgo } from "@/lib/items";
import { getItemWithQuestions } from "@/lib/items-server";
import { DeleteItemButton } from "./delete-button";

export const metadata: Metadata = { title: "Item" };

export default function ItemPage({ params, searchParams }: PageProps<"/items/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" aria-label="Loading item" />
        </div>
      }
    >
      <ItemDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ItemDetail({ params, searchParams }: PageProps<"/items/[id]">) {
  const { id } = await params;
  const { new: isNew } = await searchParams;
  const data = await getItemWithQuestions(id);
  if (!data) notFound();

  const { item, questions, isMine, isSignedIn } = data;
  const category = getCategory(item.category);

  return (
    <article className="flex flex-col gap-5">
      {isNew && isMine && (
        <p role="status" className="flex items-start gap-2 rounded-2xl bg-found-soft p-4 text-sm text-found">
          <CircleCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <span>
            <strong className="block">Your item is posted. Thank you!</strong>
            The owner can now find it in search. You&apos;ll review their answers before anyone
            sees your contact details.
          </span>
        </p>
      )}

      <ItemPhoto
        path={item.photo_path}
        category={item.category}
        title={item.title}
        sensitive={item.is_sensitive}
        reveal={isMine}
        sizes="(max-width: 672px) 100vw, 672px"
        priority
        className="aspect-[4/3] w-full rounded-3xl"
        iconClassName="size-16"
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{item.title}</h1>
          <StatusBadge status={item.status} />
        </div>
        {item.description && <p className="text-muted-foreground">{item.description}</p>}
      </div>

      <dl className="grid gap-3 rounded-2xl border bg-card p-4 text-sm">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <dt className="text-muted-foreground">{item.status === "found" ? "Found at" : "Lost at"}</dt>
            <dd className="font-medium">{item.location_name}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <dt className="text-muted-foreground">When</dt>
            <dd className="font-medium">
              {formatDateTime(item.happened_at)}{" "}
              <span className="font-normal text-muted-foreground">({timeAgo(item.happened_at)})</span>
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Tag className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <dt className="text-muted-foreground">Category</dt>
            <dd className="font-medium">{category.label}</dd>
          </div>
        </div>
      </dl>

      {questions.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="flex items-center gap-2 font-semibold">
            <MessageCircleQuestion className="size-5 text-primary" aria-hidden="true" />
            {isMine ? "Your questions for the owner" : "To claim it, you'll answer"}
          </h2>
          <ol className="flex list-decimal flex-col gap-1.5 rounded-2xl border bg-card py-3 pr-4 pl-9 text-sm">
            {questions.map((q) => (
              <li key={q.id}>{q.question}</li>
            ))}
          </ol>
        </section>
      )}

      {isMine ? (
        <div className="flex flex-col gap-2">
          <p className="text-center text-sm text-muted-foreground">You reported this item.</p>
          <DeleteItemButton itemId={item.id} />
        </div>
      ) : isSignedIn ? (
        <Button className="h-12 text-base" disabled>
          This is mine (claims coming soon)
        </Button>
      ) : (
        <Button
          className="h-12 text-base"
          nativeButton={false}
          render={<Link href={`/login?next=/items/${item.id}`} />}
        >
          Sign in to claim this item
        </Button>
      )}
    </article>
  );
}
