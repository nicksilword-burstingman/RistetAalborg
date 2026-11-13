import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { hashPassword } from "../src/lib/server/security";
import { dataDirectory } from "../src/lib/server/database";

async function main() {
  try {
    process.loadEnvFile(path.join(process.cwd(), ".env.local"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const directory = dataDirectory();
  await mkdir(directory, { recursive: true });
  const password = randomBytes(18).toString("base64url");
  const hash = await hashPassword(password);
  await writeFile(path.join(directory, "admin-password.hash"), hash + "\n", {
    mode: 0o600,
    flag: process.argv.includes("--reset") ? "w" : "wx",
  });
  await writeFile(
    path.join(directory, "ADMIN-ADGANG.txt"),
    `RISTET AALBORG – DIN ADMINISTRATORADGANG\n\nAdresse: http://localhost:3000/admin\nAdgangskode: ${password}\n\nGem koden i din adgangskodeadministrator, og slet derefter denne fil.\nKoden er oprettet tilfældigt på din computer og er ikke sendt til GitHub.\n\nVed offentlig drift skal hjemmesiden bruge HTTPS og en vedvarende datamappe.\nEn ny kode kan oprettes med npm run admin:setup -- --reset. Det afslutter eksisterende sessioner.\n`,
    { mode: 0o600 },
  );
  console.log(
    `Administratoradgang oprettet. Find din kode i ${path.join(directory, "ADMIN-ADGANG.txt")}`,
  );
}
main().catch((error) => {
  console.error(
    error.code === "EEXIST"
      ? "Der findes allerede en administratorkode. Brug --reset for at udskifte den."
      : error.message,
  );
  process.exitCode = 1;
});
