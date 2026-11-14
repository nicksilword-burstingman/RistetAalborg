import "server-only";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { networkInterfaces } from "node:os";
import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import { headers } from "next/headers";
import { dataDirectory, getDatabase } from "./database";

function authSecret() {
  if (process.env.BETTER_AUTH_SECRET) return process.env.BETTER_AUTH_SECRET;
  const file = path.join(dataDirectory(), "customer-auth.secret");
  try {
    return readFileSync(file, "utf8").trim();
  } catch {
    try {
      writeFileSync(file, randomBytes(48).toString("base64url"), {
        flag: "wx",
        mode: 0o600,
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    return readFileSync(file, "utf8").trim();
  }
}
function createAuth() {
  const db = getDatabase();
  const baseURL =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";
  const url = new URL(baseURL);
  const trustedOrigins = [url.origin];
  if (["localhost", "127.0.0.1"].includes(url.hostname)) {
    const port = url.port || "3000";
    trustedOrigins.push(`http://localhost:${port}`, `http://127.0.0.1:${port}`);
    for (const entry of Object.values(networkInterfaces()).flat()) {
      if (
        entry?.family === "IPv4" &&
        /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(entry.address)
      )
        trustedOrigins.push(`http://${entry.address}:${port}`);
    }
  }
  return betterAuth({
    appName: "Ristet Aalborg",
    baseURL,
    trustedOrigins,
    secret: authSecret(),
    database: db,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    user: { modelName: "customer_user", changeEmail: { enabled: false } },
    session: {
      modelName: "customer_session",
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    account: { modelName: "customer_account" },
    verification: { modelName: "customer_verification" },
    rateLimit: {
      enabled: true,
      storage: "database",
      modelName: "customer_rate_limit",
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/email": { window: 60, max: 8 },
        "/sign-up/email": { window: 60, max: 5 },
      },
    },
    advanced: {
      cookiePrefix: "ristet_customer",
      useSecureCookies: baseURL.startsWith("https://"),
    },
  });
}
let instance: Promise<ReturnType<typeof createAuth>> | undefined;
export function customerAuth() {
  instance ??= (async () => {
    const auth = createAuth();
    const migration = await getMigrations(auth.options);
    await migration.runMigrations();
    return auth;
  })().catch((error) => {
    instance = undefined;
    throw error;
  });
  return instance;
}
export async function customerSession(requestHeaders?: Headers) {
  const auth = await customerAuth();
  return auth.api.getSession({ headers: requestHeaders ?? (await headers()) });
}
