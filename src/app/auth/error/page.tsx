import type { Metadata } from "next";
import Link from "next/link";
import { LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Link problem" };

export default function AuthErrorPage() {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 pt-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-lost-soft text-lost">
        <LinkIcon className="size-6" aria-hidden="true" />
      </span>
      <h1 className="text-xl font-bold">That link didn&apos;t work</h1>
      <p className="text-sm text-muted-foreground">
        The confirmation link may have expired, been used already, or been opened in a
        different browser from the one you signed up in. Try signing in. If that fails,
        create your account again.
      </p>
      <div className="mt-2 flex gap-2">
        <Button className="h-11 px-4" nativeButton={false} render={<Link href="/login" />}>
          Sign in
        </Button>
        <Button variant="outline" className="h-11 px-4" nativeButton={false} render={<Link href="/signup" />}>
          Create account
        </Button>
      </div>
    </div>
  );
}
