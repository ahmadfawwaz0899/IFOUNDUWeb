"use client";

import { useActionState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { signUp, type FormState } from "@/app/auth/actions";
import { Field, FormMessage } from "@/components/form-ui";
import { Button } from "@/components/ui/button";

export function SignupForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, {});

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center" role="status">
        <span className="flex size-12 items-center justify-center rounded-full bg-found-soft text-found">
          <MailCheck className="size-6" aria-hidden="true" />
        </span>
        <h2 className="text-lg font-semibold">Check your email</h2>
        <p className="text-sm text-muted-foreground">{state.success}</p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field
        id="fullName"
        name="fullName"
        label="Full name"
        autoComplete="name"
        required
        minLength={2}
        defaultValue={state.fields?.fullName}
      />
      <Field
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.fields?.email}
      />
      <Field
        id="password"
        name="password"
        type="password"
        label="Password"
        hint="At least 8 characters."
        autoComplete="new-password"
        required
        minLength={8}
      />
      <FormMessage error={state.error} />
      <Button type="submit" disabled={pending} className="h-12 text-base">
        {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
