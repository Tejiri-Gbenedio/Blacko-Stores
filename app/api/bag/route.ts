import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { bagItems, garments, garmentVariants } from "@/db/schema";
import { BAG_COOKIE_NAME, getOrCreateBagSession } from "@/lib/session";

const addBagSchema = z.object({
  variantId: z.string().uuid(),
});

async function loadSessionBag(sessionId: string) {
  const db = getDb();
  if (!db) return { items: [], subtotalKobo: 0 };

  const rows = await db
    .select({
      id: bagItems.id,
      variantId: bagItems.variantId,
      quantity: bagItems.quantity,
      size: garmentVariants.size,
      garmentId: garments.id,
      title: garments.title,
      priceKobo: garments.priceKobo,
      foldedImgUrl: garments.foldedImgUrl,
    })
    .from(bagItems)
    .innerJoin(garmentVariants, eq(bagItems.variantId, garmentVariants.id))
    .innerJoin(garments, eq(garmentVariants.garmentId, garments.id))
    .where(eq(bagItems.sessionId, sessionId));

  const subtotalKobo = rows.reduce((sum, item) => sum + item.priceKobo * item.quantity, 0);
  return { items: rows, subtotalKobo };
}

export async function GET() {
  const sessionInfo = await getOrCreateBagSession();
  if (!sessionInfo) {
    return NextResponse.json({ items: [], subtotalKobo: 0, mode: "local" });
  }

  const payload = await loadSessionBag(sessionInfo.session.id);
  const res = NextResponse.json(payload);
  if (sessionInfo.isNew) {
    res.cookies.set(BAG_COOKIE_NAME, sessionInfo.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
}

export async function POST(req: Request) {
  const db = getDb();
  if (!db) {
    return NextResponse.json({ persisted: false, mode: "local" });
  }

  const body = await req.json().catch(() => null);
  const parsed = addBagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid variantId" }, { status: 400 });
  }

  const [variant] = await db
    .select()
    .from(garmentVariants)
    .where(eq(garmentVariants.id, parsed.data.variantId))
    .limit(1);

  if (!variant || variant.stockQty < 1) {
    return NextResponse.json({ error: "Selected size is out of stock" }, { status: 409 });
  }

  const sessionInfo = await getOrCreateBagSession();
  if (!sessionInfo) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  await db.insert(bagItems).values({
    sessionId: sessionInfo.session.id,
    variantId: variant.id,
    quantity: 1,
  });

  const payload = await loadSessionBag(sessionInfo.session.id);
  const res = NextResponse.json(payload, { status: 201 });
  if (sessionInfo.isNew) {
    res.cookies.set(BAG_COOKIE_NAME, sessionInfo.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
}
