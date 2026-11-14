import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { setTimeout as delay } from "node:timers/promises";
import { hashPassword } from "../src/lib/server/security";

// Runs the actual production server against an isolated, disposable database.
// No real credentials, user database or Stripe transactions are used.
async function main() {
  const workspace = path.resolve(process.cwd());
  const directory = path.join(
    workspace,
    ".data",
    `checkout-http-${randomUUID()}`,
  );
  assert.ok(directory.startsWith(path.join(workspace, ".data") + path.sep));
  await mkdir(directory, { recursive: true });
  const base = "http://127.0.0.1:3107";
  const password = "http-integration-fixture-password";
  const server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3107",
    ],
    {
      cwd: workspace,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        RISTET_DATA_DIR: directory,
        ADMIN_PASSWORD_HASH: await hashPassword(password),
        RISTET_CHECKOUT_MODE: "disabled",
        STRIPE_SECRET_KEY: "sk_test_http_unit_fixture",
        STRIPE_WEBHOOK_SECRET: "whsec_http_unit_fixture",
        STRIPE_MOBILEPAY_ENABLED: "false",
      },
    },
  );
  let output = "";
  server.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });
  const request = (route: string, init?: RequestInit) =>
    fetch(base + route, { ...init, redirect: "manual" });
  const jsonHeaders = (cookie = "") => ({
    "Content-Type": "application/json",
    Origin: base,
    Cookie: cookie,
  });
  try {
    let started = false;
    for (let i = 0; i < 100; i++) {
      if (server.exitCode !== null)
        throw new Error(`Test server exited: ${output.slice(-1500)}`);
      try {
        if ((await request("/kasse")).status === 200) {
          started = true;
          break;
        }
      } catch {
        /* Wait for the child server. */
      }
      await delay(150);
    }
    assert.ok(started, "Production test server did not start");
    const privatePage = await request("/admin/handel");
    assert.equal(privatePage.status, 307);
    assert.equal(privatePage.headers.get("location"), "/admin");
    const options = await request("/api/checkout/options");
    assert.match(options.headers.get("cache-control")!, /no-store/);
    const ownerCookie = options.headers.getSetCookie()[0].split(";")[0];
    assert.match(options.headers.getSetCookie()[0], /HttpOnly/i);
    const publicConfig = await options.json();
    assert.equal(publicConfig.payment.ready, false);
    assert.equal(publicConfig.payment.mode, "disabled");
    assert.equal(JSON.stringify(publicConfig).includes("sk_test_http"), false);
    assert.deepEqual(publicConfig.shippingMethods, []);
    assert.equal(
      (
        await request("/api/admin/checkout", {
          method: "PUT",
          headers: jsonHeaders(),
          body: "{}",
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await request("/api/checkout/quote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://foreign.example",
          },
          body: "{}",
        })
      ).status,
      403,
    );
    const login = await request("/api/admin/login", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ password }),
    });
    assert.equal(login.status, 200);
    const adminCookie = login.headers.getSetCookie()[0].split(";")[0];
    const settings = {
      shippingMethods: [
        {
          id: "http-fixture",
          name: "Testlevering",
          description: "Kun en test",
          amountOre: 3900,
          freeAboveOre: 40000,
        },
      ],
      termsReady: false,
    };
    assert.equal(
      (
        await request("/api/admin/checkout", {
          method: "PUT",
          headers: jsonHeaders(adminCookie),
          body: JSON.stringify(settings),
        })
      ).status,
      200,
    );
    const items = [
      { productId: "guatemala", grams: 500, quantity: 2, support: false },
    ];
    const quoteRequest = { items, shippingId: "http-fixture" };
    const quote = await request("/api/checkout/quote", {
      method: "POST",
      headers: jsonHeaders(ownerCookie),
      body: JSON.stringify(quoteRequest),
    });
    assert.equal(quote.status, 200);
    const calculated = await quote.json();
    assert.equal(calculated.quote.totalOre, 31900);
    assert.equal(calculated.quote.vatOre, 6380);
    assert.match(calculated.quoteId, /^[a-f0-9]{64}$/);
    for (const badItems of [
      [{ ...items[0], priceOre: 1 }],
      [{ ...items[0], support: true }],
      [{ ...items[0], productId: "missing" }],
    ])
      assert.equal(
        (
          await request("/api/checkout/quote", {
            method: "POST",
            headers: jsonHeaders(ownerCookie),
            body: JSON.stringify({ ...quoteRequest, items: badItems }),
          })
        ).status,
        400,
      );
    assert.equal(
      (
        await request("/api/checkout/session", {
          method: "POST",
          headers: jsonHeaders(ownerCookie),
          body: "{}",
        })
      ).status,
      503,
    );
    const status = await request(
      "/api/checkout/status?session_id=cs_test_unknown1234567890",
      { headers: { Cookie: ownerCookie } },
    );
    assert.equal(status.status, 404);
    assert.match(status.headers.get("cache-control")!, /no-store/);
    assert.equal(
      (await request("/api/stripe/webhook", { method: "POST", body: "{}" }))
        .status,
      400,
    );
    assert.equal(
      (
        await request("/api/stripe/webhook", {
          method: "POST",
          headers: { "stripe-signature": "invalid" },
          body: "{}",
        })
      ).status,
      400,
    );
    const authorized = await request("/admin/handel", {
      headers: { Cookie: adminCookie },
    });
    assert.equal(authorized.status, 200);
    assert.match(await authorized.text(), /Ordrer/);
    const db = new DatabaseSync(path.join(directory, "ristet.sqlite"));
    try {
      assert.equal(
        db.prepare("SELECT count(*) AS n FROM commerce_orders").get()!.n,
        0,
      );
    } finally {
      db.close();
    }
    console.log(
      "Checkout HTTP checks passed: guest/admin access, persistent shipping, server prices, invalid inputs, disabled payments and signature rejection. No transactions created.",
    );
  } finally {
    server.kill();
    if (server.exitCode === null)
      await new Promise<void>((resolve) =>
        server.once("exit", () => resolve()),
      );
    const resolved = path.resolve(directory);
    assert.ok(
      resolved.startsWith(path.join(workspace, ".data") + path.sep) &&
        path.basename(resolved).startsWith("checkout-http-"),
    );
    await rm(resolved, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 200,
    });
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
