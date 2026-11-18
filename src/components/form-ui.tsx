import { CircleAlert, CircleCheck, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  id,
  className,
  ...input
}: React.ComponentProps<"input"> & { label: string; hint?: string; id: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={cn(
          "h-12 w-full rounded-xl border bg-card px-4 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          className
        )}
        {...input}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Required phone number, saved to the user's private contact details. */
export function PhoneField({
  defaultValue,
  who,
}: {
  defaultValue?: string;
  who: "finder" | "owner";
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Field
        id="phone"
        name="phone"
        type="tel"
        label="Your phone number"
        autoComplete="tel"
        inputMode="tel"
        placeholder="e.g. 012-345 6789"
        required
        minLength={7}
        maxLength={20}
        defaultValue={defaultValue}
      />
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        Kept private. The {who} only sees it after
        {who === "finder" ? " they approve your claim" : " you approve their claim"}, so you can
        call or WhatsApp each other.
      </p>
    </div>
  );
}

export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-xl p-3 text-sm",
        error ? "bg-destructive/10 text-destructive" : "bg-found-soft text-found"
      )}
    >
      {error ? (
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      ) : (
        <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      )}
      <span>{error ?? success}</span>
    </p>
  );
}
