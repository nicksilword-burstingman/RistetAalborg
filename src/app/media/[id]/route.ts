import { readFile } from "node:fs/promises";
import path from "node:path";
import { dataDirectory, getDatabase } from "@/lib/server/database";

export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
      id,
    ) ||
    !getDatabase().prepare("SELECT id FROM media_assets WHERE id=?").get(id)
  )
    return new Response("Ikke fundet", { status: 404 });
  try {
    const data = await readFile(
      path.join(dataDirectory(), "uploads", `${id}.webp`),
    );
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Content-Length": String(data.length),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Ikke fundet", { status: 404 });
  }
}
