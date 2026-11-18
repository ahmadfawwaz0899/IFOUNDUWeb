import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ItemPhoto } from "@/components/item-photo";
import { getCurrentUser } from "@/lib/auth";
import { getItemPageData } from "@/lib/claims-server";
import { ClaimForm } from "./claim-form";

export const metadata: Metadata = { title: "Claim item" };

export default function ClaimPage({ params }: PageProps<"/items/[id]/claim">) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" aria-label="Loading" />
        </div>
      }
    >
      <Claim params={params} />
    </Suspense>
  );
}

async function Claim({ params }: Pick<PageProps<"/items/[id]/claim">, "params">) {
  const { id } = await params;
  const data = await getItemPageData(id);
  if (!data) notFound();

  const { item, questions, viewerId, isMine, myClaim } = data;
  if (!viewerId) redirect(`/login?next=/items/${id}/claim`);
  const user = await getCurrentUser();
  // Nothing to claim: send them back to the item page, which explains why.
  if (isMine || myClaim || item.is_resolved || item.status !== "found") redirect(`/items/${id}`);

  return (
    <div className="flex flex-col gap-5">
      <Link
        href={`/items/${id}`}
        className="inline-flex min-h-11 items-center gap-1 self-start rounded-lg text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to item
      </Link>

      <div className="flex items-center gap-3">
        <ItemPhoto
          path={item.photo_path}
          category={item.category}
          title={item.title}
          sensitive={item.is_sensitive}
          sizes="64px"
          className="size-16 shrink-0 rounded-xl"
        />
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Claiming</p>
          <h1 className="truncate text-xl font-bold">{item.title}</h1>
        </div>
      </div>

      <p className="rounded-2xl bg-secondary p-4 text-sm text-secondary-foreground">
        Answer the finder&apos;s questions so they can tell it&apos;s really yours. If they approve,
        you&apos;ll both see each other&apos;s contact details to arrange the return.
      </p>

      <ClaimForm itemId={id} questions={questions} savedPhone={user?.phone ?? ""} />
    </div>
  );
}
