import { MapPinCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <MapPinCheck className="size-[18px]" aria-hidden="true" />
      </span>
      <span className="text-lg font-bold tracking-tight">
        IFound<span className="text-primary">U</span>
      </span>
    </span>
  );
}
