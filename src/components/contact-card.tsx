import { Mail, MessageCircle, Phone, UserRound } from "lucide-react";
import type { Contact } from "@/lib/claims-server";

/** Contact details, shown only after a claim is approved. */
export function ContactCard({ name, contact }: { name: string | null; contact: Contact | null }) {
  if (!contact) {
    return (
      <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
        Contact details aren&apos;t available.
      </p>
    );
  }
  const phoneDigits = contact.phone?.replace(/[^\d+]/g, "");
  // WhatsApp needs the country code: "012…" (Malaysia) becomes "6012…".
  const waNumber = phoneDigits?.startsWith("+")
    ? phoneDigits.slice(1)
    : phoneDigits?.startsWith("0")
      ? `60${phoneDigits.slice(1)}`
      : phoneDigits;

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-background p-3 text-sm">
      {name && (
        <p className="flex items-center gap-2 font-semibold">
          <UserRound className="size-4 text-primary" aria-hidden="true" /> {name}
        </p>
      )}
      {contact.phone && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <a
            href={`tel:${phoneDigits}`}
            className="inline-flex min-h-11 items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
          >
            <Phone className="size-4" aria-hidden="true" /> {contact.phone}
          </a>
          {waNumber && (
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 font-medium text-found underline-offset-4 hover:underline"
            >
              <MessageCircle className="size-4" aria-hidden="true" /> WhatsApp
            </a>
          )}
        </div>
      )}
      {contact.email && (
        <a
          href={`mailto:${contact.email}`}
          className="inline-flex min-h-11 items-center gap-2 break-all font-medium text-primary underline-offset-4 hover:underline"
        >
          <Mail className="size-4 shrink-0" aria-hidden="true" /> {contact.email}
        </a>
      )}
      {contact.preferred && (
        <p className="text-muted-foreground">Best way to reach: {contact.preferred}</p>
      )}
    </div>
  );
}
