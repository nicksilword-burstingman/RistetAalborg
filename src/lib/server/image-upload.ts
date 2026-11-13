import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export async function optimizeUpload(buffer: Buffer, declaredType: string) {
  if (buffer.length === 0 || buffer.length > MAX_UPLOAD_BYTES)
    throw new Error("Vælg et billede på højst 10 MB.");
  const types: Record<string, string> = {
    "image/jpeg": "jpeg",
    "image/png": "png",
    "image/webp": "webp",
  };
  if (!types[declaredType])
    throw new Error("Vælg et JPG-, PNG- eller WebP-billede.");
  const image = sharp(buffer, {
    limitInputPixels: 40000000,
    failOn: "warning",
  });
  const metadata = await image.metadata();
  if (
    metadata.format !== types[declaredType] ||
    !metadata.width ||
    !metadata.height ||
    (metadata.pages || 1) > 1
  )
    throw new Error("Billedfilen er ugyldig eller animeret.");
  return image
    .rotate()
    .resize({
      width: 2000,
      height: 2000,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 86 })
    .toBuffer({ resolveWithObject: true });
}
