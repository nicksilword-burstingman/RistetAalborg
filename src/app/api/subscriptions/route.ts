import { NextResponse } from "next/server";
import { subscriptionSettings } from "@/lib/server/subscription-repository";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET() {
  return NextResponse.json(
    { settings: subscriptionSettings(), billingReady: false },
    { headers: { "Cache-Control": "no-store" } },
  );
}
