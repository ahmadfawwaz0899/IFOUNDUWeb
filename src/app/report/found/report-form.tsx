"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Plus, ShieldAlert, X } from "lucide-react";
import { createFoundItem, type ReportState } from "@/app/items/actions";
import { Field, FormMessage, PhoneField } from "@/components/form-ui";
import { Button } from "@/components/ui/button";
import { categories } from "@/lib/categories";
import { compressImage, PENDING_PHOTO_KEY } from "@/lib/image";
import { PHOTO_BUCKET } from "@/lib/items";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const MAX_QUESTIONS = 3;

/** Current local date-time in the format a datetime-local input expects. */
function localNow() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function ReportForm({ userId, savedPhone }: { userId: string; savedPhone: string }) {
  const [state, formAction, saving] = useActionState<ReportState, FormData>(createFoundItem, {});
  const [photo, setPhoto] = useState<string | null>(null); // preview (data URL)
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [questionKeys, setQuestionKeys] = useState([0]);
  const nextKey = useRef(1);
  const fileRef = useRef<HTMLInputElement>(null);
  const whenRef = useRef<HTMLInputElement>(null);

  // Fill in "now" using the phone's own clock and time zone.
  useEffect(() => {
    if (whenRef.current) {
      whenRef.current.max = localNow();
      if (!whenRef.current.value) whenRef.current.value = localNow();
    }
  }, []);

  // Pick up the photo taken on the Scan page, if there is one.
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem(PENDING_PHOTO_KEY);
      if (pending) {
        sessionStorage.removeItem(PENDING_PHOTO_KEY);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage once on load
        setPhoto(pending);
      }
    } catch {
      // Storage blocked (private mode): the user can still pick a photo below.
    }
  }, []);

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLocalError("Please choose an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
    setLocalError(null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);
    if (!photo) {
      setLocalError("Please add a photo of the item.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const local = String(formData.get("when") ?? "");
    if (!local) {
      setLocalError("Please enter when you found it.");
      return;
    }
    formData.set("happenedAt", new Date(local).toISOString()); // convert to a full date with time zone

    setUploading(true);
    try {
      const blob = await compressImage(photo);
      const path = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error } = await createClient()
        .storage.from(PHOTO_BUCKET)
        .upload(path, blob, { contentType: "image/jpeg" });
      if (error) throw error;
      formData.set("photoPath", path);
    } catch {
      setUploading(false);
      setLocalError("Couldn't upload the photo. Check your connection and try again.");
      return;
    }
    setUploading(false);
    startTransition(() => formAction(formData));
  }

  const busy = uploading || saving;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {/* 1. Photo */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">Photo</legend>
        {photo ? (
          <div className="relative overflow-hidden rounded-2xl border bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element -- local preview before upload */}
            <img src={photo} alt="The item you found" className="aspect-[4/3] w-full object-contain" />
            <Button
              type="button"
              variant="secondary"
              className="absolute right-3 bottom-3 h-10 px-3"
              onClick={() => fileRef.current?.click()}
            >
              <Camera /> Change photo
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-secondary text-secondary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ImagePlus className="size-8" aria-hidden="true" />
            <span className="font-semibold">Take or upload a photo</span>
            <span className="text-xs text-muted-foreground">A clear photo helps the owner recognise it</span>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={onFileChosen}
        />
      </fieldset>

      {/* 2. What is it */}
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-sm font-semibold">What is it?</legend>
        <Field
          id="title"
          name="title"
          label="Item name"
          placeholder="e.g. Black iPhone 13"
          required
          minLength={2}
          maxLength={120}
        />
        <div className="flex flex-col gap-1.5">
          <span id="category-label" className="text-sm font-medium">
            Category
          </span>
          <div role="radiogroup" aria-labelledby="category-label" className="flex flex-wrap gap-2">
            {categories.map(({ id, label, icon: Icon }) => (
              <label key={id} className="cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={id}
                  required
                  defaultChecked={id === "other"}
                  className="peer sr-only"
                />
                <span className="flex h-11 items-center gap-2 rounded-full border bg-card px-4 text-sm font-medium transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50">
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-medium">
            Description <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={1000}
            placeholder="Colour, brand, case, stickers, damage…"
            className="w-full rounded-xl border bg-card px-4 py-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <p className="text-xs text-muted-foreground">
            Don&apos;t reveal everything. Keep a detail back for your questions below.
          </p>
        </div>
      </fieldset>

      {/* 3. Where and when */}
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-sm font-semibold">Where and when?</legend>
        <Field
          id="location"
          name="location"
          label="Where you found it"
          placeholder="e.g. Library, Level 2, near the printers"
          required
          minLength={2}
        />
        <Field ref={whenRef} id="when" name="when" type="datetime-local" label="When you found it" required />
      </fieldset>

      {/* 4. Questions for the owner */}
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-semibold">Questions for the owner</legend>
        <p className="-mt-1 text-sm text-muted-foreground">
          Ask something only the real owner would know. You&apos;ll judge their answers before
          sharing your contact details.
        </p>
        {questionKeys.map((key, i) => (
          <div key={key} className="flex items-end gap-2">
            <div className="flex-1">
              <Field
                id={`question-${key}`}
                name="question"
                label={`Question ${i + 1}`}
                placeholder={
                  i === 0 ? "e.g. What is the lock screen picture?" : "e.g. What's written inside the case?"
                }
                required={i === 0}
                maxLength={300}
              />
            </div>
            {questionKeys.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                className="size-12 shrink-0"
                aria-label={`Remove question ${i + 1}`}
                onClick={() => setQuestionKeys((keys) => keys.filter((k) => k !== key))}
              >
                <X className="size-5" />
              </Button>
            )}
          </div>
        ))}
        {questionKeys.length < MAX_QUESTIONS && (
          <Button
            type="button"
            variant="ghost"
            className="h-11 self-start px-3 text-primary"
            onClick={() => setQuestionKeys((keys) => [...keys, nextKey.current++])}
          >
            <Plus /> Add another question
          </Button>
        )}
      </fieldset>

      {/* 5. How the owner can reach you (after you approve) */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">How the owner can reach you</legend>
        <PhoneField defaultValue={savedPhone} who="owner" />
      </fieldset>

      {/* 6. Sensitive */}
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border bg-card p-4">
        <input type="checkbox" name="isSensitive" className="mt-1 size-5 accent-primary" />
        <span className="flex-1">
          <span className="flex items-center gap-1.5 font-semibold">
            <ShieldAlert className="size-4 text-lost" aria-hidden="true" /> Sensitive item
          </span>
          <span className="text-sm text-muted-foreground">
            ID cards, bank cards, documents. The photo is blurred in public lists.
          </span>
        </span>
      </label>

      <FormMessage error={localError ?? state.error} />

      <Button type="submit" disabled={busy} className={cn("h-12 text-base", busy && "cursor-wait")}>
        {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
        {uploading ? "Uploading photo…" : saving ? "Saving…" : "Post found item"}
      </Button>
    </form>
  );
}
