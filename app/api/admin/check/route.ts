import { NextResponse } from "next/server";
import { isRequestAdminAuthenticated } from "@/lib/admin-auth";

export async function GET(req: Request) {
  const authenticated = isRequestAdminAuthenticated(req);
  return NextResponse.json({ ok: true, authenticated });
}
