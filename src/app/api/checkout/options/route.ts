import { NextResponse } from "next/server";
import {
  checkoutOwner,
  CHECKOUT_COOKIE,
  privateHeaders,
} from "@/lib/server/checkout-http";
import { getDatabase } from "@/lib/server/database";
import { orderRepository } from "@/lib/server/order-repository";
import { paymentConfiguration } from "@/lib/server/checkout-config";
import { newSessionToken } from "@/lib/server/security";

export const runtime = "nodejs";
export async function GET() {
  const settings = orderRepository(getDatabase()).settings();
  const config = paymentConfiguration(settings);
  const response = NextResponse.json(
    {
      shippingMethods: settings.shippingMethods,
      payment: {
        mode: config.mode,
        ready: config.ready,
        issues: config.issues,
        mobilePay: config.mobilePay,
      },
    },
    { headers: privateHeaders },
  );
  if (!(await checkoutOwner()))
    response.cookies.set(CHECKOUT_COOKIE, newSessionToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: config.siteUrl.startsWith("https:"),
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  return response;
}
