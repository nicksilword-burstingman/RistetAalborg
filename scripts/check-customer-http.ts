import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { defaultSubscription } from "../src/lib/subscriptions";

async function main() {
  const workspace = path.resolve(process.cwd());
  const directory = path.join(
    workspace,
    ".data",
    `customer-http-${randomUUID()}`,
  );
  assert.ok(directory.startsWith(path.join(workspace, ".data") + path.sep));
  await mkdir(directory, { recursive: true });
  const base = "http://127.0.0.1:3108";
  const server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3108",
    ],
    {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        RISTET_DATA_DIR: directory,
        BETTER_AUTH_URL: base,
        NEXT_PUBLIC_SITE_URL: base,
        RISTET_CHECKOUT_MODE: "disabled",
      },
    },
  );
  let output = "";
  server.stdout.on("data", (chunk) => {
    output += chunk;
  });
  server.stderr.on("data", (chunk) => {
    output += chunk;
  });
  const request = (route: string, init?: RequestInit) =>
    fetch(base + route, { ...init, redirect: "manual" });
  const headers = (cookie = "", origin = base) => ({
    "Content-Type": "application/json",
    Origin: origin,
    Cookie: cookie,
  });
  const cookieFrom = (response: Response) =>
    response.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0])
      .join("; ");
  const post = (route: string, body: unknown, cookie = "", origin = base) =>
    request(route, {
      method: "POST",
      headers: headers(cookie, origin),
      body: JSON.stringify(body),
    });
  try {
    let started = false;
    for (let i = 0; i < 100; i++) {
      if (server.exitCode !== null)
        throw new Error(`Testserver stoppede: ${output.slice(-1500)}`);
      try {
        if ((await request("/konto")).status === 200) {
          started = true;
          break;
        }
      } catch {}
      await delay(150);
    }
    assert.ok(started);
    assert.equal((await request("/api/konto")).status, 200);
    assert.deepEqual(await (await request("/api/konto")).json(), {
      user: null,
    });
    assert.equal(
      (await post("/api/auth/sign-up/email", {}, "", "https://other.example"))
        .status,
      403,
    );
    assert.equal(
      (
        await request("/api/konto", {
          method: "PUT",
          headers: headers(),
          body: "{}",
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await request("/api/admin/subscriptions", {
          method: "PUT",
          headers: headers(),
          body: "{}",
        })
      ).status,
      403,
    );
    const password = "customer-http-test-only-password";
    const signup = await post("/api/auth/sign-up/email", {
      name: "Testkunde A",
      email: "customer-a@example.com",
      password,
    });
    assert.equal(
      signup.status,
      200,
      `Kontooprettelse fejlede: ${await signup.clone().text()} ${output.slice(-1800)}`,
    );
    const customerA = cookieFrom(signup);
    assert.match(customerA, /ristet_customer/);
    assert.match(signup.headers.getSetCookie().join(" "), /httponly/i);
    assert.match(signup.headers.getSetCookie().join(" "), /samesite=lax/i);
    const profile = await request("/api/konto", {
      headers: headers(customerA),
    });
    assert.match(profile.headers.get("cache-control")!, /no-store/);
    assert.equal((await profile.json()).user.email, "customer-a@example.com");
    const address = {
      firstName: "Test",
      lastName: "Kunde",
      phone: "",
      address: "Testvej 1",
      address2: "",
      postalCode: "9000",
      city: "Aalborg",
      country: "DK",
    };
    const save = await request("/api/konto", {
      method: "PUT",
      headers: headers(customerA),
      body: JSON.stringify({ address, subscriptions: [defaultSubscription] }),
    });
    assert.equal(save.status, 200);
    assert.equal(
      (
        await post("/api/auth/sign-in/email", {
          email: "customer-a@example.com",
          password: "incorrect",
        })
      ).status,
      401,
    );
    const signupB = await post("/api/auth/sign-up/email", {
      name: "Testkunde B",
      email: "customer-b@example.com",
      password,
    });
    assert.equal(signupB.status, 200);
    const customerB = cookieFrom(signupB);
    const otherProfile = await (
      await request("/api/konto", { headers: headers(customerB) })
    ).json();
    assert.equal(otherProfile.profile.address, null);
    assert.deepEqual(otherProfile.profile.subscriptions, []);
    assert.deepEqual(otherProfile.orders, []);
    assert.equal(
      (
        await request("/api/admin/checkout", {
          method: "PUT",
          headers: headers(customerA),
          body: "{}",
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await request("/api/konto", {
          method: "PUT",
          headers: headers(customerB),
          body: JSON.stringify({ userId: "other", address, subscriptions: [] }),
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await post(
          "/api/auth/change-password",
          {
            currentPassword: password,
            newPassword: password + "-changed",
            revokeOtherSessions: true,
          },
          customerA,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await post("/api/auth/sign-in/email", {
          email: "customer-a@example.com",
          password,
        })
      ).status,
      401,
    );
    const login = await post("/api/auth/sign-in/email", {
      email: "customer-a@example.com",
      password: password + "-changed",
    });
    assert.equal(login.status, 200);
    const newCookie = cookieFrom(login);
    assert.equal(
      (
        await (
          await request("/api/konto", { headers: headers(newCookie) })
        ).json()
      ).profile.address.city,
      "Aalborg",
    );
    assert.equal((await post("/api/auth/sign-out", {}, newCookie)).status, 200);
    assert.equal(
      (
        await (
          await request("/api/konto", { headers: headers(newCookie) })
        ).json()
      ).user,
      null,
    );
    const plans = await (await request("/api/subscriptions")).json();
    assert.equal(plans.billingReady, false);
    assert.equal(plans.settings.prices["1000"], 27900);
    assert.equal((await post("/api/checkout/session", {})).status, 401);
    assert.equal(
      (
        await post("/api/auth/request-password-reset", {
          email: "customer-a@example.com",
        })
      ).status,
      404,
    );
    console.log(
      "Customer HTTP checks passed: registration, login, private profile persistence, customer isolation, admin denial, password change, logout/revocation, subscription prices and closed billing.",
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
        path.basename(resolved).startsWith("customer-http-"),
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
