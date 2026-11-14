import "server-only";
import { cookies } from "next/headers";
import { digest } from "./security";

export const CHECKOUT_COOKIE = "ristet_checkout";
export const privateHeaders = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie",
};
export async function checkoutOwner() {
  const token = (await cookies()).get(CHECKOUT_COOKIE)?.value;
  return token && /^[a-f0-9]{64}$/.test(token) ? digest(token) : null;
}
