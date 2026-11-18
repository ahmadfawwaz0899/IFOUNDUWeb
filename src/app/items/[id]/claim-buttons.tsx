"use client";

import { useTransition } from "react";
import { Check, Loader2, PartyPopper, Undo2, X } from "lucide-react";
import { decideClaim, markReturned, withdrawClaim } from "@/app/claims/actions";
import { Button } from "@/components/ui/button";

export function DecideButtons({ claimId, claimantName }: { claimId: string; claimantName: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        type="button"
        variant="outline"
        className="h-11"
        disabled={pending}
        onClick={() => {
          if (window.confirm(`Reject ${claimantName}'s claim?`)) start(() => decideClaim(claimId, "rejected"));
        }}
      >
        <X aria-hidden="true" /> Reject
      </Button>
      <Button
        type="button"
        className="h-11 bg-found text-white hover:bg-found/90 dark:text-black"
        disabled={pending}
        onClick={() => {
          if (
            window.confirm(
              `Approve ${claimantName}? You'll both see each other's contact details.`
            )
          )
            start(() => decideClaim(claimId, "approved"));
        }}
      >
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
        Approve
      </Button>
    </div>
  );
}

export function WithdrawButton({ claimId }: { claimId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      className="h-11"
      disabled={pending}
      onClick={() => {
        if (window.confirm("Withdraw your claim?")) start(() => withdrawClaim(claimId));
      }}
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Undo2 aria-hidden="true" />}
      Withdraw claim
    </Button>
  );
}

export function MarkReturnedButton({ itemId }: { itemId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      className="h-12 text-base"
      disabled={pending}
      onClick={() => {
        if (
          window.confirm(
            "Mark as returned? The item is removed from public lists and any other claims are declined."
          )
        )
          start(() => markReturned(itemId));
      }}
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <PartyPopper aria-hidden="true" />}
      Mark as returned to owner
    </Button>
  );
}
