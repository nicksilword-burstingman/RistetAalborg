import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/server/admin";
import { dataDirectory, getDatabase } from "@/lib/server/database";
import { isSameOrigin } from "@/lib/server/security";
import { MAX_UPLOAD_BYTES, optimizeUpload } from "@/lib/server/image-upload";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return NextResponse.json(
      { error: "Anmodningen blev afvist." },
      { status: 403 },
    );
  if (!(await getAdminSession()))
    return NextResponse.json(
      { error: "Log ind igen for at uploade." },
      { status: 401 },
    );
  if (Number(request.headers.get("content-length")) > MAX_UPLOAD_BYTES + 65536)
    return NextResponse.json(
      { error: "Vælg et billede på højst 10 MB." },
      { status: 413 },
    );
  // Bound chunked requests as well, before parsing multipart input.
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = request.body?.getReader();
  if (!reader)
    return NextResponse.json(
      { error: "Der mangler et billede." },
      { status: 400 },
    );
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    size += result.value.length;
    if (size > MAX_UPLOAD_BYTES + 65536) {
      await reader.cancel();
      return NextResponse.json(
        { error: "Vælg et billede på højst 10 MB." },
        { status: 413 },
      );
    }
    chunks.push(result.value);
  }
  try {
    const data = await new Response(Buffer.concat(chunks), {
      headers: { "Content-Type": request.headers.get("content-type") || "" },
    }).formData();
    const file = data.get("file");
    if (!(file instanceof File)) throw new Error("Der mangler et billede.");
    const optimized = await optimizeUpload(
      Buffer.from(await file.arrayBuffer()),
      file.type,
    );
    const id = randomUUID();
    const directory = path.join(dataDirectory(), "uploads");
    await mkdir(directory, { recursive: true });
    const destination = path.join(directory, `${id}.webp`);
    await writeFile(destination, optimized.data, { flag: "wx" });
    try {
      getDatabase()
        .prepare("INSERT INTO media_assets VALUES (?, ?, ?, ?)")
        .run(id, optimized.info.width, optimized.info.height, Date.now());
    } catch (error) {
      await unlink(destination);
      throw error;
    }
    return NextResponse.json(
      {
        id,
        src: `/media/${id}`,
        width: optimized.info.width,
        height: optimized.info.height,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error &&
          /^(Vælg|Billedfilen|Der mangler)/.test(error.message)
            ? error.message
            : "Billedet kunne ikke læses. Prøv et andet JPG-, PNG- eller WebP-billede.",
      },
      { status: 400 },
    );
  }
}
