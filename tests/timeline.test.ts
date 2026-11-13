import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { initializeDatabase } from "../src/lib/server/database";
import {
  createTimelineRepository,
  RevisionConflict,
  seedTimeline,
} from "../src/lib/server/timeline-repository";
import { orderChapters, timelineProgress } from "../src/lib/timeline";
import { timelineDocumentSchema } from "../src/lib/timeline-schema";

const seed = timelineDocumentSchema.parse(
  JSON.parse(readFileSync("content/timeline.json", "utf8")),
);
function database() {
  const db = new DatabaseSync(":memory:");
  initializeDatabase(db);
  seedTimeline(db);
  return db;
}
test("new chapters and reordered images persist, with the future chapter always last", () => {
  const db = database();
  try {
    const repository = createTimelineRepository(db);
    const document = repository.read();
    document.chapters.push({
      id: "ny-forhandler",
      period: "2027",
      dateTime: "2027",
      title: "Den første forhandler",
      body: "Et nyt kapitel.",
      sortOrder: 999,
      isFuture: false,
      images: [],
    });
    document.chapters[0].images[0].focusX = 18;
    document.chapters[0].images[0].crop = "square";
    const saved = repository.save(document);
    assert.equal(saved.revision, 2);
    assert.equal(saved.chapters.at(-1)?.id, "fremtiden");
    assert.equal(saved.chapters.at(-2)?.id, "ny-forhandler");
    assert.equal(saved.chapters[0].images[0].focusX, 18);
    assert.equal(saved.chapters[0].images[0].crop, "square");
    seedTimeline(db);
    assert.equal(
      repository.read().revision,
      2,
      "initial seed must never overwrite an edited story",
    );
  } finally {
    db.close();
  }
});
test("a stale editor cannot overwrite another editor's changes", () => {
  const db = database();
  try {
    const repository = createTimelineRepository(db);
    const first = repository.read(),
      second = repository.read();
    first.chapters[0].title = "Gemt i den første fane";
    repository.save(first);
    assert.throws(() => repository.save(second), RevisionConflict);
    assert.equal(repository.read().chapters[0].title, first.chapters[0].title);
  } finally {
    db.close();
  }
});
test("a failed database write rolls back chapters, images and revision together", () => {
  const db = database();
  try {
    const repository = createTimelineRepository(db);
    const before = repository.read();
    const changed = structuredClone(before);
    changed.chapters[1].title = "afvis";
    db.exec(
      "CREATE TRIGGER reject_chapter BEFORE INSERT ON timeline_chapters WHEN NEW.title='afvis' BEGIN SELECT RAISE(ABORT, 'test constraint'); END;",
    );
    assert.throws(() => repository.save(changed));
    assert.deepEqual(repository.read(), before);
  } finally {
    db.close();
  }
});
test("image deletion and chapter deletion leave no empty image rows", () => {
  const db = database();
  try {
    const repository = createTimelineRepository(db);
    const document = repository.read();
    const removed = document.chapters[1].id;
    document.chapters[0].images = [];
    document.chapters = document.chapters.filter((c) => c.id !== removed);
    const saved = repository.save(document);
    assert.equal(saved.chapters[0].images.length, 0);
    assert.equal(
      Number(
        db
          .prepare(
            "SELECT COUNT(*) AS total FROM timeline_images WHERE chapter_id=?",
          )
          .get(removed)?.total,
      ),
      0,
    );
  } finally {
    db.close();
  }
});
test("validation rejects duplicate IDs, unsafe image paths and invalid focus coordinates", () => {
  const duplicate = structuredClone(seed);
  duplicate.chapters[1].id = duplicate.chapters[0].id;
  assert.equal(timelineDocumentSchema.safeParse(duplicate).success, false);
  for (const src of [
    "https://example.com/a.jpg",
    "/media/../../secret",
    "/images/timeline/../../secret.webp",
  ]) {
    const document = structuredClone(seed);
    document.chapters[0].images[0].src = src;
    assert.equal(timelineDocumentSchema.safeParse(document).success, false);
  }
  const badFocus = structuredClone(seed);
  badFocus.chapters[0].images[0].focusX = 101;
  assert.equal(timelineDocumentSchema.safeParse(badFocus).success, false);
});
test("timeline progress clamps at both ends and reverses when scrolling back", () => {
  assert.equal(timelineProgress(900, 2000, 800), 0);
  const down = timelineProgress(-700, 2000, 800);
  const up = timelineProgress(-100, 2000, 800);
  assert.ok(down > up && up > 0);
  assert.equal(timelineProgress(-3000, 2000, 800), 1);
  assert.equal(timelineProgress(0, 0, 800), 1);
});
test("image order is independent of image array order", () => {
  const chapter = structuredClone(seed.chapters[0]);
  chapter.images.push({
    ...chapter.images[0],
    id: "10000000-0000-4000-8000-000000000001",
    sortOrder: -1,
  });
  assert.equal(orderChapters([chapter])[0].images[0].sortOrder, -1);
});
