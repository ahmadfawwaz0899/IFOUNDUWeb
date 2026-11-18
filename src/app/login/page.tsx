import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 pt-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-muted-foreground">
          Sign in to report items, claim what&apos;s yours and get match alerts.
        </p>
      </div>
      {/* The form reads ?next= from the URL, which is only known at request time */}
      <Suspense fallback={<div className="h-[248px]" aria-hidden="true" />}>
        <LoginForm />
      </Suspense>
      <p className="text-center text-sm text-muted-foreground">
        New to IFoundU?{" "}
        <Link href="/signup" className="font-semibold text-primary underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
