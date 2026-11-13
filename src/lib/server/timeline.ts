import "server-only";
import { getDatabase } from "./database";
import { createTimelineRepository, seedTimeline } from "./timeline-repository";

export function timelineRepository() {
  const db = getDatabase();
  seedTimeline(db);
  return createTimelineRepository(db);
}
