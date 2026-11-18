"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteItem } from "@/app/items/actions";
import { Button } from "@/components/ui/button";

export function DeleteItemButton({ itemId }: { itemId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      className="h-11 text-base"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Delete this report? This can't be undone.")) return;
        startTransition(() => deleteItem(itemId));
      }}
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
      {pending ? "Deleting…" : "Delete report"}
    </Button>
  );
}
