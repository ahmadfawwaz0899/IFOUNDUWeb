import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  CalendarClock,
  CircleCheck,
  Clock,
  Hand,
  Loader2,
  MapPin,
  MessageCircleQuestion,
  PartyPopper,
  Tag,
  XCircle,
} from "lucide-react";
import { ContactCard } from "@/components/contact-card";
import { StatusBadge } from "@/components/item-card";
import { ItemPhoto } from "@/components/item-photo";
import { Button } from "@/components/ui/button";
import { getCategory } from "@/lib/categories";
import {
  getItemPageData,
  type ClaimStatus,
  type IncomingClaim,
  type MyClaim,
  type Question,
} from "@/lib/claims-server";
import { formatDateTime, timeAgo } from "@/lib/items";
import { cn } from "@/lib/utils";
import { DecideButtons, MarkReturnedButton, WithdrawButton } from "./claim-buttons";
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
  const sp = await searchParams;
  const data = await getItemPageData(id);
  if (!data) notFound();

  const { item, questions, viewerId, isMine, incoming, myClaim } = data;
  const category = getCategory(item.category);

  return (
    <article className="flex flex-col gap-5">
      {sp.new && isMine && (
        <Banner tone="found" icon={CircleCheck} title="Your item is posted. Thank you!">
          The owner can now find it in search. You&apos;ll review their answers before anyone sees
          your contact details.
        </Banner>
      )}
      {sp.claimed && myClaim && (
        <Banner tone="found" icon={CircleCheck} title="Claim sent">
          The finder will review your answers. Check back here or under Profile → Claims.
        </Banner>
      )}
      {item.is_resolved && (
        <Banner tone="primary" icon={PartyPopper} title="Returned to its owner">
          This item has been reunited with its owner. Thanks for using IFoundU!
        </Banner>
      )}

      <ItemPhoto
        path={item.photo_path}
        category={item.category}
        title={item.title}
        sensitive={item.is_sensitive}
        reveal={isMine || myClaim?.status === "approved"}
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
        <Detail icon={MapPin} label={item.status === "found" ? "Found at" : "Lost at"}>
          {item.location_name}
        </Detail>
        <Detail icon={CalendarClock} label="When">
          {formatDateTime(item.happened_at)}{" "}
          <span className="font-normal text-muted-foreground">({timeAgo(item.happened_at)})</span>
        </Detail>
        <Detail icon={Tag} label="Category">
          {category.label}
        </Detail>
      </dl>

      {isMine ? (
        <FinderView
          itemId={item.id}
          resolved={item.is_resolved}
          questions={questions}
          claims={incoming}
        />
      ) : (
        <ClaimantView
          itemId={item.id}
          canClaim={item.status === "found" && !item.is_resolved}
          signedIn={Boolean(viewerId)}
          questions={questions}
          myClaim={myClaim}
        />
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* What the finder sees on their own item                              */
/* ------------------------------------------------------------------ */
function FinderView({
  itemId,
  resolved,
  questions,
  claims,
}: {
  itemId: string;
  resolved: boolean;
  questions: Question[];
  claims: IncomingClaim[];
}) {
  const hasApproved = claims.some((c) => c.status === "approved");

  return (
    <>
      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <Hand className="size-5 text-primary" aria-hidden="true" />
          Claims {claims.length > 0 && <span className="text-muted-foreground">({claims.length})</span>}
        </h2>

        {claims.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
            No one has claimed this yet. When the owner answers your questions, their claim
            appears here for you to review.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {claims.map((c) => (
              <li key={c.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{c.claimantName}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(c.created_at)}</p>
                  </div>
                  <ClaimBadge status={c.status} />
                </div>

                <dl className="flex flex-col gap-2 text-sm">
                  {questions.map((q) => (
                    <div key={q.id} className="rounded-xl bg-muted p-3">
                      <dt className="text-muted-foreground">{q.question}</dt>
                      <dd className="mt-0.5 font-medium whitespace-pre-wrap">
                        {c.answers[q.id] || <span className="italic text-muted-foreground">No answer</span>}
                      </dd>
                    </div>
                  ))}
                  {c.message && (
                    <div className="rounded-xl bg-muted p-3">
                      <dt className="text-muted-foreground">Message</dt>
                      <dd className="mt-0.5 whitespace-pre-wrap">{c.message}</dd>
                    </div>
                  )}
                </dl>

                {c.status === "pending" && !resolved && (
                  <DecideButtons claimId={c.id} claimantName={c.claimantName} />
                )}
                {c.status === "approved" && (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium">Contact the owner to arrange the return:</p>
                    <ContactCard name={c.claimantName} contact={c.contact} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {questions.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="flex items-center gap-2 font-semibold">
            <MessageCircleQuestion className="size-5 text-primary" aria-hidden="true" />
            Your questions for the owner
          </h2>
          <ol className="flex list-decimal flex-col gap-1.5 rounded-2xl border bg-card py-3 pr-4 pl-9 text-sm">
            {questions.map((q) => (
              <li key={q.id}>{q.question}</li>
            ))}
          </ol>
        </section>
      )}

      <div className="flex flex-col gap-2">
        {hasApproved && !resolved && <MarkReturnedButton itemId={itemId} />}
        <DeleteItemButton itemId={itemId} />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* What everyone else sees                                             */
/* ------------------------------------------------------------------ */
function ClaimantView({
  itemId,
  canClaim,
  signedIn,
  questions,
  myClaim,
}: {
  itemId: string;
  canClaim: boolean;
  signedIn: boolean;
  questions: Question[];
  myClaim: MyClaim | null;
}) {
  if (myClaim) {
    return (
      <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">Your claim</h2>
          <ClaimBadge status={myClaim.status} />
        </div>
        {myClaim.status === "pending" && (
          <>
            <p className="text-sm text-muted-foreground">
              Sent {timeAgo(myClaim.created_at)}. The finder is reviewing your answers.
            </p>
            <WithdrawButton claimId={myClaim.id} />
          </>
        )}
        {myClaim.status === "approved" && (
          <>
            <p className="text-sm text-muted-foreground">
              The finder approved your claim. Contact them to arrange collecting your item:
            </p>
            <ContactCard name={myClaim.finderName} contact={myClaim.finderContact} />
          </>
        )}
        {myClaim.status === "rejected" && (
          <p className="text-sm text-muted-foreground">
            The finder didn&apos;t approve this claim. If you&apos;re sure it&apos;s yours, check
            other listings or report it as lost.
          </p>
        )}
      </section>
    );
  }

  if (!canClaim) return null;

  return (
    <div className="flex flex-col gap-3">
      {questions.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="flex items-center gap-2 font-semibold">
            <MessageCircleQuestion className="size-5 text-primary" aria-hidden="true" />
            To claim it, you&apos;ll answer
          </h2>
          <ol className="flex list-decimal flex-col gap-1.5 rounded-2xl border bg-card py-3 pr-4 pl-9 text-sm">
            {questions.map((q) => (
              <li key={q.id}>{q.question}</li>
            ))}
          </ol>
        </section>
      )}
      <Button
        className="h-12 text-base"
        nativeButton={false}
        render={
          <Link href={signedIn ? `/items/${itemId}/claim` : `/login?next=/items/${itemId}/claim`} />
        }
      >
        <Hand aria-hidden="true" />
        {signedIn ? "This is mine" : "Sign in to claim this item"}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                         */
/* ------------------------------------------------------------------ */
function ClaimBadge({ status }: { status: ClaimStatus }) {
  const map = {
    pending: { label: "Waiting", icon: Clock, className: "bg-lost-soft text-lost" },
    approved: { label: "Approved", icon: CircleCheck, className: "bg-found-soft text-found" },
    rejected: { label: "Not approved", icon: XCircle, className: "bg-muted text-muted-foreground" },
  }[status];
  const Icon = map.icon;
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-semibold",
        map.className
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" /> {map.label}
    </span>
  );
}

function Banner({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: "found" | "primary";
  icon: typeof CircleCheck;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <p
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-2xl p-4 text-sm",
        tone === "found" ? "bg-found-soft text-found" : "bg-secondary text-secondary-foreground"
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <span>
        <strong className="block">{title}</strong>
        {children}
      </span>
    </p>
  );
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <div>
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="font-medium">{children}</dd>
      </div>
    </div>
  );
}
