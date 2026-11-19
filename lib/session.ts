import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { getDb } from "@/db";
import { bagSessions } from "@/db/schema";

export const BAG_COOKIE_NAME = "blacko_bag_session";

export async function getOrCreateBagSession() {
  const db = getDb();
  if (!db) return null;

  const cookieStore = await cookies();
  let token = cookieStore.get(BAG_COOKIE_NAME)?.value;

  if (token) {
    const existing = await db
      .select()
      .from(bagSessions)
      .where(eq(bagSessions.token, token))
      .limit(1);
    if (existing[0]) {
      return { session: existing[0], isNew: false, token };
    }
  }

  token = crypto.randomBytes(24).toString("hex");
  const [created] = await db.insert(bagSessions).values({ token }).returning();
  return { session: created, isNew: true, token };
}
