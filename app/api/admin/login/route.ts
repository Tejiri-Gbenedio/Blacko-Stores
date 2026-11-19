import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  ADMIN_COOKIE_NAME,
  generateAdminToken,
  getAdminSecret,
} from "@/lib/admin-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const passcode = typeof body?.passcode === "string" ? body.passcode.trim() : "";

    const secret = getAdminSecret();
    const isMatch =
      passcode.length > 0 &&
      passcode.length === secret.length &&
      crypto.timingSafeEqual(Buffer.from(passcode, "utf8"), Buffer.from(secret, "utf8"));

    if (!isMatch) {
      return NextResponse.json(
        { ok: false, error: "Invalid atelier passcode." },
        { status: 401 }
      );
    }

    const token = generateAdminToken();
    const response = NextResponse.json({ ok: true, message: "Atelier access granted." });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json(
      { ok: false, error: "Authentication service error." },
      { status: 500 }
    );
  }
}
