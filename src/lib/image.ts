/**
 * Shrinks a photo before upload: max 1280px on the longest side, saved as JPEG.
 * Redrawing on a canvas also strips hidden metadata such as GPS location.
 */
export async function compressImage(source: Blob | string, maxSize = 1280): Promise<Blob> {
  const url = typeof source === "string" ? source : URL.createObjectURL(source);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read that image."));
      el.src = url;
    });

    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Could not process that image."))),
        "image/jpeg",
        0.82
      )
    );
  } finally {
    if (typeof source !== "string") URL.revokeObjectURL(url);
  }
}

/** Photo handed from the Scan page to the report form (kept only for this browser tab). */
export const PENDING_PHOTO_KEY = "ifoundu:pending-photo";
