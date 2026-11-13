import { timelineDocumentSchema } from "../timeline-schema";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  orderChapters,
  type TimelineDocument,
  type TimelineImage,
} from "../timeline";

export class RevisionConflict extends Error {}

export interface TimelineRepository {
  read(): TimelineDocument;
  save(document: TimelineDocument): TimelineDocument;
}

export function createTimelineRepository(db: DatabaseSync): TimelineRepository {
  function writeChapters(document: TimelineDocument) {
    db.exec("DELETE FROM timeline_chapters");
    const insertChapter = db.prepare(
      "INSERT INTO timeline_chapters VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    const insertImage = db.prepare(
      "INSERT INTO timeline_images VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    for (const chapter of document.chapters) {
      insertChapter.run(
        chapter.id,
        chapter.period,
        chapter.dateTime,
        chapter.title,
        chapter.body,
        chapter.sortOrder,
        Number(chapter.isFuture),
      );
      for (const image of chapter.images) {
        insertImage.run(
          image.id,
          chapter.id,
          image.src,
          image.alt,
          image.caption,
          image.width,
          image.height,
          image.focusX,
          image.focusY,
          image.crop,
          image.sortOrder,
        );
      }
    }
  }

  return {
    read() {
      const meta = db
        .prepare("SELECT revision FROM timeline_document WHERE id=1")
        .get();
      if (!meta) throw new Error("Tidslinjen er ikke initialiseret.");
      const imageRows = db
        .prepare("SELECT * FROM timeline_images ORDER BY sort_order, id")
        .all();
      const chapters = db
        .prepare(
          "SELECT * FROM timeline_chapters ORDER BY is_future, sort_order, id",
        )
        .all()
        .map((row) => ({
          id: String(row.id),
          period: String(row.period),
          dateTime: String(row.date_time),
          title: String(row.title),
          body: String(row.body),
          sortOrder: Number(row.sort_order),
          isFuture: Boolean(row.is_future),
          images: imageRows
            .filter((i) => i.chapter_id === row.id)
            .map((i): TimelineImage => ({
              id: String(i.id),
              src: String(i.src),
              alt: String(i.alt),
              caption: String(i.caption),
              width: Number(i.width),
              height: Number(i.height),
              focusX: Number(i.focus_x),
              focusY: Number(i.focus_y),
              crop: i.crop as TimelineImage["crop"],
              sortOrder: Number(i.sort_order),
            })),
        }));
      return timelineDocumentSchema.parse({
        revision: Number(meta.revision),
        chapters: orderChapters(chapters),
      });
    },
    save(input) {
      const document = timelineDocumentSchema.parse(input);
      db.exec("BEGIN IMMEDIATE");
      try {
        const result = db
          .prepare(
            "UPDATE timeline_document SET revision=revision+1, updated_at=? WHERE id=1 AND revision=?",
          )
          .run(new Date().toISOString(), document.revision);
        if (Number(result.changes) !== 1)
          throw new RevisionConflict(
            "Historien er ændret i en anden fane. Genindlæs før du gemmer igen.",
          );
        writeChapters(document);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      return this.read();
    },
  };
}

export function seedTimeline(db: DatabaseSync) {
  if (db.prepare("SELECT id FROM timeline_document WHERE id=1").get()) return;
  const seed = timelineDocumentSchema.parse(
    JSON.parse(
      readFileSync(path.join(process.cwd(), "content/timeline.json"), "utf8"),
    ),
  );
  db.exec("BEGIN IMMEDIATE");
  try {
    // Multiple server workers may reach initialization at once. Recheck under the write lock.
    if (!db.prepare("SELECT id FROM timeline_document WHERE id=1").get()) {
      db.prepare("INSERT INTO timeline_document VALUES (1, 1, ?)").run(
        new Date().toISOString(),
      );
      // Save uses its own transaction; write the initial rows without nesting it.
      const chapterStatement = db.prepare(
        "INSERT INTO timeline_chapters VALUES (?, ?, ?, ?, ?, ?, ?)",
      );
      const imageStatement = db.prepare(
        "INSERT INTO timeline_images VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      );
      for (const c of seed.chapters) {
        chapterStatement.run(
          c.id,
          c.period,
          c.dateTime,
          c.title,
          c.body,
          c.sortOrder,
          Number(c.isFuture),
        );
        for (const i of c.images)
          imageStatement.run(
            i.id,
            c.id,
            i.src,
            i.alt,
            i.caption,
            i.width,
            i.height,
            i.focusX,
            i.focusY,
            i.crop,
            i.sortOrder,
          );
      }
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
