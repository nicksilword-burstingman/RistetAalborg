import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import {
  MAX_UPLOAD_BYTES,
  optimizeUpload,
} from "../src/lib/server/image-upload";

test("uploads are decoded, optimized, resized and stripped of metadata", async () => {
  const buffer = await sharp({
    create: { width: 2500, height: 1500, channels: 3, background: "#777b61" },
  })
    .jpeg()
    .withExif({ IFD0: { Artist: "Private artist metadata" } })
    .toBuffer();
  const result = await optimizeUpload(buffer, "image/jpeg");
  const metadata = await sharp(result.data).metadata();
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, 2000);
  assert.equal(metadata.height, 1200);
  assert.equal(metadata.exif, undefined);
});
test("uploads reject SVG, disguised image types, corrupt bytes and oversized files", async () => {
  const png = await sharp({
    create: { width: 10, height: 10, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  await assert.rejects(() =>
    optimizeUpload(Buffer.from("<svg></svg>"), "image/svg+xml"),
  );
  await assert.rejects(() => optimizeUpload(png, "image/jpeg"));
  await assert.rejects(() =>
    optimizeUpload(Buffer.from("not-an-image"), "image/png"),
  );
  await assert.rejects(() =>
    optimizeUpload(Buffer.alloc(MAX_UPLOAD_BYTES + 1), "image/png"),
  );
});
