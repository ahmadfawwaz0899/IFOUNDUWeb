"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { signIn, type FormState } from "@/app/auth/actions";
import { Field, FormMessage } from "@/components/form-ui";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});

  return (
    <form action={action} className="flex flex-col gap-4">
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
        autoComplete="current-password"
        required
      />
      <FormMessage error={state.error} />
      <Button type="submit" disabled={pending} className="h-12 text-base">
        {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
