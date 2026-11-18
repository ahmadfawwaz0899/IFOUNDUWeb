"use client";

import { useActionState, useState } from "react";
import { ChevronDown, Loader2, Lock } from "lucide-react";
import { updateProfile, type FormState } from "@/app/auth/actions";
import { Field, FormMessage } from "@/components/form-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EditProfile(props: { fullName: string; phone: string; preferred: string }) {
  const [open, setOpen] = useState(!props.phone); // open by default until contact details are added
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {});

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="edit-profile"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50"
      >
        <span>
          <span className="block font-semibold">Your details</span>
          <span className="block text-xs text-muted-foreground">
            {props.phone ? "Name and contact details" : "Add a phone number so owners can reach you"}
          </span>
        </span>
        <ChevronDown
          className={cn("size-5 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open && (
        <form id="edit-profile" action={action} className="flex flex-col gap-4 border-t p-4">
          <Field id="fullName" name="fullName" label="Full name" defaultValue={props.fullName} required />
          <Field
            id="phone"
            name="phone"
            type="tel"
            label="Phone number"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+60 12-345 6789"
            defaultValue={props.phone}
          />
          <Field
            id="preferred"
            name="preferred"
            label="Best way to reach you"
            placeholder="e.g. WhatsApp after 6pm"
            defaultValue={props.preferred}
          />
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Only shown to the other person after you approve a claim, or after they approve yours.
          </p>
          <FormMessage error={state.error} success={state.success} />
          <Button type="submit" disabled={pending} className="h-11 text-base">
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {pending ? "Saving…" : "Save details"}
          </Button>
        </form>
      )}
    </section>
  );
}
