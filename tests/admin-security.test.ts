import assert from "node:assert/strict";
import { test } from "node:test";
import {
  digest,
  hashPassword,
  isSameOrigin,
  newSessionToken,
  readBoundedJson,
  RequestSizeError,
  verifyPassword,
} from "../src/lib/server/security";

test("JSON body limits also reject oversized requests without a Content-Length header", async () => {
  const create = (body: string) =>
    new Request("http://localhost/api/admin/login", { method: "POST", body });
  assert.deepEqual(await readBoundedJson(create('{"ok":true}'), 100), {
    ok: true,
  });
  await assert.rejects(
    () =>
      readBoundedJson(
        create(JSON.stringify({ password: "x".repeat(5000) })),
        4096,
      ),
    RequestSizeError,
  );
  await assert.rejects(
    () => readBoundedJson(create("not JSON"), 4096),
    SyntaxError,
  );
});

test("administrator password hashes use independent salts and reject wrong or malformed credentials", async () => {
  const password = "a-long-test-password-for-the-admin";
  const first = await hashPassword(password),
    second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword("wrong-password", first), false);
  assert.equal(
    await verifyPassword(password, "scrypt-v1:invalid:invalid"),
    false,
  );
  assert.equal(await verifyPassword("x".repeat(1000), first), false);
});
test("session tokens are unpredictable, and stored digests do not expose the token", () => {
  const first = newSessionToken(),
    second = newSessionToken();
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.notEqual(first, second);
  assert.notEqual(digest(first), first);
});
test("mutations reject foreign or missing origins", () => {
  const url = "http://localhost:3000/api/admin/timeline";
  assert.equal(isSameOrigin(new Request(url)), false);
  assert.equal(
    isSameOrigin(
      new Request(url, { headers: { origin: "https://attacker.example" } }),
    ),
    false,
  );
  assert.equal(
    isSameOrigin(
      new Request(url, { headers: { origin: "http://localhost:3000" } }),
    ),
    true,
  );
  assert.equal(
    isSameOrigin(new Request(url, { headers: { origin: "null" } })),
    false,
  );
});
