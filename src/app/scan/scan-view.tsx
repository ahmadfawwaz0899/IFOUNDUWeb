"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { compressImage, PENDING_PHOTO_KEY } from "@/lib/image";
import {
  Camera,
  CameraOff,
  ImageUp,
  Loader2,
  RotateCcw,
  Search,
  Sparkles,
  HandHeart,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Step = "starting" | "camera" | "no-camera" | "captured" | "chosen";
type Intent = "found" | "lost";

export function ScanView() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("starting");
  const [photo, setPhoto] = useState<string | null>(null);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setStep("starting");
    setCameraError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser can't open the camera here. You can upload a photo instead.");
      setStep("no-camera");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }, // rear camera on phones
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStep("camera");
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      setCameraError(
        name === "NotAllowedError"
          ? "Camera permission was blocked. Allow it in your browser settings, or upload a photo instead."
          : "We couldn't find a camera. You can upload a photo instead."
      );
      setStep("no-camera");
    }
  }, []);

  // Open the camera as soon as the page loads, and close it when leaving.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- starting an external system (the camera)
    startCamera();
    return stopCamera;
  }, [startCamera, stopCamera]);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setPhoto(canvas.toDataURL("image/jpeg", 0.85)); // canvas copy has no GPS data
    stopCamera();
    setStep("captured");
  }

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result as string);
      stopCamera();
      setStep("captured");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function retake() {
    setPhoto(null);
    setIntent(null);
    startCamera();
  }

  async function choose(value: Intent) {
    if (value === "found" && photo) {
      // Hand a shrunk copy of the photo to the report form (kept only in this browser tab).
      try {
        const small = await compressImage(photo);
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(small);
        });
        sessionStorage.setItem(PENDING_PHOTO_KEY, dataUrl);
      } catch {
        // Photo too large or storage blocked: the form will ask for a photo again.
      }
      router.push("/report/found");
      return;
    }
    setIntent(value);
    setStep("chosen");
  }

  const showCamera = step === "starting" || step === "camera";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scan an item</h1>
        <p className="mt-1 text-muted-foreground">
          {photo
            ? "Got it. Now tell us about this item."
            : "Point your camera at the item and take a clear photo."}
        </p>
      </div>

      {/* Viewfinder / photo preview */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className={showCamera ? "size-full object-cover" : "hidden"}
        />

        {photo && (
          // eslint-disable-next-line @next/next/no-img-element -- local preview of a photo the user just took
          <img src={photo} alt="Photo of the item you scanned" className="size-full object-cover" />
        )}

        {step === "starting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
            <Loader2 className="size-8 animate-spin" aria-hidden="true" />
            <span className="text-sm">Opening camera…</span>
          </div>
        )}

        {step === "camera" && (
          // Corner guides to help frame the item
          <div aria-hidden="true" className="pointer-events-none absolute inset-8">
            <span className="absolute top-0 left-0 size-10 rounded-tl-2xl border-t-4 border-l-4 border-white/80" />
            <span className="absolute top-0 right-0 size-10 rounded-tr-2xl border-t-4 border-r-4 border-white/80" />
            <span className="absolute bottom-0 left-0 size-10 rounded-bl-2xl border-b-4 border-l-4 border-white/80" />
            <span className="absolute right-0 bottom-0 size-10 rounded-br-2xl border-r-4 border-b-4 border-white/80" />
          </div>
        )}

        {step === "no-camera" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center text-white">
            <CameraOff className="size-10 text-white/70" aria-hidden="true" />
            <p role="alert" className="text-sm text-white/85">
              {cameraError}
            </p>
            <Button variant="secondary" className="h-11 px-4" onClick={startCamera}>
              <RotateCcw /> Try camera again
            </Button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={onFileChosen}
      />

      {/* Controls change with each step */}
      {showCamera && (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <Button
            variant="ghost"
            className="h-12 justify-self-start px-3"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageUp /> Upload
          </Button>
          <button
            type="button"
            onClick={capture}
            disabled={step !== "camera"}
            aria-label="Take photo"
            className="flex size-[72px] items-center justify-center rounded-full border-4 border-primary bg-background outline-none transition-transform duration-150 active:scale-95 disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-ring/50"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Camera className="size-6" aria-hidden="true" />
            </span>
          </button>
          <span />
        </div>
      )}

      {step === "no-camera" && (
        <Button className="h-12 text-base" onClick={() => fileInputRef.current?.click()}>
          <ImageUp /> Upload a photo
        </Button>
      )}

      {step === "captured" && (
        <section aria-labelledby="intent-q" className="flex flex-col gap-3">
          <h2 id="intent-q" className="text-lg font-semibold">
            Did you find this item, or are you looking for it?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => choose("found")}
              className="flex min-h-28 flex-col items-start gap-2 rounded-2xl border bg-found-soft p-4 text-left outline-none transition-transform duration-150 active:scale-[0.98] focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <HandHeart className="size-6 text-found" aria-hidden="true" />
              <span className="font-semibold">I found it</span>
              <span className="text-sm text-muted-foreground">Help return it</span>
            </button>
            <button
              type="button"
              onClick={() => choose("lost")}
              className="flex min-h-28 flex-col items-start gap-2 rounded-2xl border bg-lost-soft p-4 text-left outline-none transition-transform duration-150 active:scale-[0.98] focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Search className="size-6 text-lost" aria-hidden="true" />
              <span className="font-semibold">I&apos;m looking for it</span>
              <span className="text-sm text-muted-foreground">Find a match</span>
            </button>
          </div>
          <Button variant="ghost" className="h-11" onClick={retake}>
            <RotateCcw /> Retake photo
          </Button>
        </section>
      )}

      {step === "chosen" && intent && (
        <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4" aria-live="polite">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" aria-hidden="true" />
            <h2 className="font-semibold">
              {intent === "found" ? "Next: report this item" : "Next: find a match"}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {intent === "found"
              ? "Soon, AI will read this photo and fill in the item details for you. Then you'll add where and when you found it, and questions only the real owner can answer."
              : "Soon, AI will compare this photo with every found item and show the closest matches."}
          </p>
          <div className="flex flex-wrap gap-2">
            {intent === "lost" && (
              <Button className="h-11 px-4" nativeButton={false} render={<Link href="/search" />}>
                <Search /> Search by keyword
              </Button>
            )}
            <Button variant="outline" className="h-11 px-4" onClick={retake}>
              <RotateCcw /> Scan another item
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
