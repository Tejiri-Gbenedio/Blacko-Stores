import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { contactMessages, dropSubscribers } from "@/db/schema";
import { isRequestAdminAuthenticated } from "@/lib/admin-auth";

export async function GET(req: Request) {
  if (!isRequestAdminAuthenticated(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({
        ok: true,
        contactMessages: [
          {
            id: "00000000-0000-4000-8000-000000000010",
            name: "Tunde Bakare",
            email: "tunde@example.com",
            subject: "Sizing & Fit",
            message: "Good day, what chest measurement would you recommend for an athletic build at 6ft?",
            createdAt: new Date().toISOString(),
          },
        ],
        dropSubscribers: [
          {
            id: "00000000-0000-4000-8000-000000000020",
            email: "vip-collector@lagos.ng",
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }

    const messages = await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));

    const subscribers = await db
      .select()
      .from(dropSubscribers)
      .orderBy(desc(dropSubscribers.createdAt));

    return NextResponse.json({
      ok: true,
      contactMessages: messages,
      dropSubscribers: subscribers,
    });
  } catch (err) {
    console.error("Admin inbox fetch error:", err);
    return NextResponse.json({ ok: false, error: "Failed to load inbox" }, { status: 500 });
  }
}
