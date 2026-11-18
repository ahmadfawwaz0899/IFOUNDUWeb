"use client";

import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";
import { submitClaim, type ClaimFormState } from "@/app/claims/actions";
import { FormMessage, PhoneField } from "@/components/form-ui";
import { Button } from "@/components/ui/button";
import type { Question } from "@/lib/claims-server";

const textareaClass =
  "w-full rounded-xl border bg-card px-4 py-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ClaimForm({
  itemId,
  questions,
  savedPhone,
}: {
  itemId: string;
  questions: Question[];
  savedPhone: string;
}) {
  const [state, action, pending] = useActionState<ClaimFormState, FormData>(submitClaim, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="itemId" value={itemId} />

      {questions.map((q, i) => (
        <div key={q.id} className="flex flex-col gap-1.5">
          <label htmlFor={`answer-${q.id}`} className="text-sm font-medium">
            {i + 1}. {q.question}
          </label>
          <textarea
            id={`answer-${q.id}`}
            name={`answer-${q.id}`}
            rows={2}
            required
            maxLength={500}
            defaultValue={state.answers?.[q.id]}
            className={textareaClass}
          />
        </div>
      ))}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-sm font-medium">
          Message to the finder <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          maxLength={500}
          placeholder="Any other detail that proves it's yours, or when you can collect it."
          defaultValue={state.message}
          className={textareaClass}
        />
      </div>

      <PhoneField defaultValue={state.phone ?? savedPhone} who="finder" />

      <FormMessage error={state.error} />

      <Button type="submit" disabled={pending} className="h-12 text-base">
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
        {pending ? "Sending…" : "Send claim"}
      </Button>
    </form>
  );
}
