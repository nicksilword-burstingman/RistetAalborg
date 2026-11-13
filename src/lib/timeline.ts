import type { z } from "zod";
import type {
  timelineImageSchema,
  timelineChapterSchema,
  timelineDocumentSchema,
} from "./timeline-schema";

export type TimelineImage = z.infer<typeof timelineImageSchema>;
export type TimelineChapter = z.infer<typeof timelineChapterSchema>;
export type TimelineDocument = z.infer<typeof timelineDocumentSchema>;

export function orderChapters(chapters: TimelineChapter[]) {
  return [...chapters]
    .sort(
      (a, b) =>
        Number(a.isFuture) - Number(b.isFuture) ||
        a.sortOrder - b.sortOrder ||
        a.id.localeCompare(b.id),
    )
    .map((chapter) => ({
      ...chapter,
      images: [...chapter.images].sort((a, b) => a.sortOrder - b.sortOrder),
    }));
}

/** Viewport threshold is shared by the line and milestone activation. */
export function timelineProgress(
  top: number,
  height: number,
  viewportHeight: number,
) {
  return Math.max(
    0,
    Math.min(1, (viewportHeight * 0.62 - top) / Math.max(1, height)),
  );
}
