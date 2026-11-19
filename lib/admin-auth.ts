import crypto from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "blacko_admin_session";

export function getAdminSecret(): string {
  return process.env.ADMIN_SECRET || "blacko-lagos-2026";
}

export function generateAdminToken(): string {
  const secret = getAdminSecret();
  return crypto
    .createHmac("sha256", secret)
    .update("blacko_atelier_admin_auth_v1")
    .digest("hex");
}

export function verifyAdminToken(token?: string | null): boolean {
  if (!token) return false;
  try {
    const expected = generateAdminToken();
    const tokenBuf = Buffer.from(token, "utf8");
    const expectedBuf = Buffer.from(expected, "utf8");
    if (tokenBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(tokenBuf, expectedBuf);
  } catch {
    return false;
  }
}

export async function isServerAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    return verifyAdminToken(sessionCookie);
  } catch {
    return false;
  }
}

export function isRequestAdminAuthenticated(req: Request): boolean {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader
        .split(";")
        .map((c) => c.trim().split("="))
        .filter(([k]) => Boolean(k))
    );
    const sessionCookie = cookies[ADMIN_COOKIE_NAME];
    return verifyAdminToken(sessionCookie);
  } catch {
    return false;
  }
}
