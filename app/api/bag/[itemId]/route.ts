import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { bagItems } from "@/db/schema";
import { getOrCreateBagSession } from "@/lib/session";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ itemId: string }> }
) {
  const db = getDb();
  if (!db) {
    return NextResponse.json({ deleted: true, mode: "local" });
  }

  const { itemId } = await context.params;
  const sessionInfo = await getOrCreateBagSession();
  if (!sessionInfo) {
    return NextResponse.json({ error: "Session unavailable" }, { status: 401 });
  }

  await db
    .delete(bagItems)
    .where(and(eq(bagItems.id, itemId), eq(bagItems.sessionId, sessionInfo.session.id)));

  return NextResponse.json({ deleted: true });
}
