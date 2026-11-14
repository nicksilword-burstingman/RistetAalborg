import { backup, DatabaseSync } from "node:sqlite";
import { copyFile, cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { dataDirectory, getDatabase } from "../src/lib/server/database";
import {
  createTimelineRepository,
  seedTimeline,
} from "../src/lib/server/timeline-repository";
import { writeFile } from "node:fs/promises";

async function optionalCopy(
  source: string,
  destination: string,
  directory = false,
) {
  try {
    if (directory) await cp(source, destination, { recursive: true });
    else await copyFile(source, destination);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
async function main() {
  try {
    process.loadEnvFile(path.join(process.cwd(), ".env.local"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const db = getDatabase();
  seedTimeline(db);
  const directory = path.join(
    dataDirectory(),
    "backups",
    new Date().toISOString().replace(/[:.]/g, "-"),
  );
  await mkdir(directory, { recursive: true });
  const filename = path.join(directory, "ristet.sqlite");
  await backup(db, filename);
  const snapshot = new DatabaseSync(filename);
  try {
    snapshot.exec("DELETE FROM admin_sessions; DELETE FROM login_attempts;");
    if (
      snapshot
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='customer_session'",
        )
        .get()
    )
      snapshot.exec("DELETE FROM customer_session;");
    await writeFile(
      path.join(directory, "historie.json"),
      JSON.stringify(createTimelineRepository(snapshot).read(), null, 2),
    );
  } finally {
    snapshot.close();
  }
  await optionalCopy(
    path.join(dataDirectory(), "uploads"),
    path.join(directory, "uploads"),
    true,
  );
  await optionalCopy(
    path.join(dataDirectory(), "admin-password.hash"),
    path.join(directory, "admin-password.hash"),
  );
  await optionalCopy(
    path.join(dataDirectory(), "customer-auth.secret"),
    path.join(directory, "customer-auth.secret"),
  );
  console.log(
    `Sikkerhedskopi gemt i ${directory}. Kopiér mappen til en anden disk eller din backupplacering.`,
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
