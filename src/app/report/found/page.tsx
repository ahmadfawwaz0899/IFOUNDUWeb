import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { ReportForm } from "./report-form";

export const metadata: Metadata = { title: "Report a found item" };

export default function ReportFoundPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Report a found item</h1>
        <p className="mt-1 text-muted-foreground">
          Thank you for helping! A few details make it easy for the owner to find it.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex justify-center py-16 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" aria-label="Loading" />
          </div>
        }
      >
        <ReportGate />
      </Suspense>
    </div>
  );
}

async function ReportGate() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center">
        <LogIn className="size-8 text-primary" aria-hidden="true" />
        <p className="font-semibold">Sign in to report an item</p>
        <p className="text-sm text-muted-foreground">
          This lets the owner contact you safely once you approve their claim.
        </p>
        <div className="flex gap-2">
          <Button
            className="h-11 px-4"
            nativeButton={false}
            render={<Link href="/login?next=/report/found" />}
          >
            Sign in
          </Button>
          <Button
            variant="outline"
            className="h-11 px-4"
            nativeButton={false}
            render={<Link href="/signup" />}
          >
            Create account
          </Button>
        </div>
      </div>
    );
  }

  return <ReportForm userId={user.id} />;
}
