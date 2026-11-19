import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { garments, garmentVariants } from "@/db/schema";
import { FALLBACK_GARMENTS } from "@/lib/fallback-garments";

export async function GET() {
  const db = getDb();
  if (!db) {
    return NextResponse.json({ garments: FALLBACK_GARMENTS, source: "fallback" });
  }

  const allGarments = await db.select().from(garments).orderBy(asc(garments.sortOrder));
  const allVariants = await db.select().from(garmentVariants);

  const grouped = allGarments.map((g) => ({
    ...g,
    variants: allVariants.filter((v) => v.garmentId === g.id),
  }));

  return NextResponse.json({
    garments: grouped.length > 0 ? grouped : FALLBACK_GARMENTS,
    source: grouped.length > 0 ? "neon" : "fallback",
  });
}
