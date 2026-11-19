import { NextResponse } from "next/server";
import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { garments, garmentVariants } from "@/db/schema";
import { FALLBACK_GARMENTS } from "@/lib/fallback-garments";
import { isRequestAdminAuthenticated } from "@/lib/admin-auth";

const inventoryPatchSchema = z.object({
  variantId: z.string().uuid().optional(),
  stockQty: z.number().int().min(0).max(999).optional(),
  garmentId: z.string().uuid().optional(),
  priceKobo: z.number().int().min(100000).optional(), // min ₦1,000
}).refine(
  (data) => (data.variantId && data.stockQty !== undefined) || (data.garmentId && data.priceKobo !== undefined),
  { message: "Must provide either variantId + stockQty or garmentId + priceKobo" }
);

export async function GET(req: Request) {
  if (!isRequestAdminAuthenticated(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ ok: true, garments: FALLBACK_GARMENTS });
    }

    const allGarments = await db.select().from(garments).orderBy(asc(garments.sortOrder));
    const allVariants = await db.select().from(garmentVariants);

    const merged = allGarments.map((g) => ({
      ...g,
      variants: allVariants.filter((v) => v.garmentId === g.id),
    }));

    return NextResponse.json({ ok: true, garments: merged });
  } catch (err) {
    console.error("Admin inventory fetch error:", err);
    return NextResponse.json({ ok: false, error: "Failed to load inventory" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!isRequestAdminAuthenticated(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = inventoryPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.errors[0]?.message || "Invalid inventory payload" },
        { status: 400 }
      );
    }

    const { variantId, stockQty, garmentId, priceKobo } = parsed.data;
    const db = getDb();

    if (!db) {
      return NextResponse.json({ ok: true, mode: "local" });
    }

    const updates: { variant?: unknown; garment?: unknown } = {};

    if (variantId && stockQty !== undefined) {
      const updatedVariant = await db
        .update(garmentVariants)
        .set({ stockQty })
        .where(eq(garmentVariants.id, variantId))
        .returning();
      updates.variant = updatedVariant[0];
    }

    if (garmentId && priceKobo !== undefined) {
      const updatedGarment = await db
        .update(garments)
        .set({ priceKobo })
        .where(eq(garments.id, garmentId))
        .returning();
      updates.garment = updatedGarment[0];
    }

    return NextResponse.json({ ok: true, updates });
  } catch (err) {
    console.error("Admin inventory update error:", err);
    return NextResponse.json({ ok: false, error: "Failed to update inventory" }, { status: 500 });
  }
}
