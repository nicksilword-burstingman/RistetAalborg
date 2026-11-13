import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/server/admin";
import { timelineRepository } from "@/lib/server/timeline";
import { RevisionConflict } from "@/lib/server/timeline-repository";
import { timelineDocumentSchema } from "@/lib/timeline-schema";
import {
  isSameOrigin,
  readBoundedJson,
  RequestSizeError,
} from "@/lib/server/security";
import { getDatabase } from "@/lib/server/database";

export async function PUT(request: Request) {
  if (!isSameOrigin(request))
    return NextResponse.json(
      { error: "Anmodningen blev afvist." },
      { status: 403 },
    );
  if (!(await getAdminSession()))
    return NextResponse.json(
      { error: "Log ind igen for at gemme." },
      { status: 401 },
    );
  let body;
  try {
    body = await readBoundedJson(request, 1500000);
  } catch (error) {
    if (error instanceof RequestSizeError)
      return NextResponse.json(
        { error: "Historien er for stor." },
        { status: 413 },
      );
    return NextResponse.json(
      { error: "Ændringerne kunne ikke læses." },
      { status: 400 },
    );
  }
  const parsed = timelineDocumentSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        error:
          "Kontrollér, at alle kapitler har dato, overskrift, tekst og billedbeskrivelser.",
        details: parsed.error.issues.map((i) => i.message),
      },
      { status: 400 },
    );
  for (const image of parsed.data.chapters.flatMap((c) => c.images)) {
    if (
      image.src.startsWith("/media/") &&
      !getDatabase()
        .prepare("SELECT id FROM media_assets WHERE id=?")
        .get(image.src.slice(7))
    ) {
      return NextResponse.json(
        { error: "Et billede findes ikke længere. Upload det igen." },
        { status: 400 },
      );
    }
  }
  try {
    const saved = timelineRepository().save(parsed.data);
    revalidatePath("/om-os");
    return NextResponse.json(saved, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof RevisionConflict)
      return NextResponse.json({ error: error.message }, { status: 409 });
    console.error("Timeline save failed", error);
    return NextResponse.json(
      { error: "Kunne ikke gemme. Dine ændringer er stadig i editoren." },
      { status: 500 },
    );
  }
}
