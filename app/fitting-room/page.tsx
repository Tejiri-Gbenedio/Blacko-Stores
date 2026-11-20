import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { garments, garmentVariants } from "@/db/schema";
import { FALLBACK_GARMENTS } from "@/lib/fallback-garments";
import type { GarmentDTO } from "@/lib/types";
import FittingRoomExperience from "@/components/fitting-room/FittingRoomExperience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Atelier Fitting Room — Virtual Try-On | Blacko Stores",
  description:
    "Preview small-batch Nigerian shirting drape, proportion, and texture on studio models Kenji (6'1\", Size L) and Ren (5'11\", Size M). Pack directly into your custom Weekender Bag.",
};

async function loadGarments(): Promise<GarmentDTO[]> {
  try {
    const db = getDb();
    if (!db) return FALLBACK_GARMENTS;

    const allGarments = await db.select().from(garments).orderBy(asc(garments.sortOrder));
    if (allGarments.length === 0) return FALLBACK_GARMENTS;

    const allVariants = await db.select().from(garmentVariants);
    return allGarments.map((g) => ({
      ...g,
      variants: allVariants.filter((v) => v.garmentId === g.id),
    }));
  } catch (err) {
    console.error("Fitting Room loadGarments database error:", err);
    return FALLBACK_GARMENTS;
  }
}

interface FittingRoomPageProps {
  searchParams: Promise<{
    shirt?: string;
    model?: string;
  }>;
}

export default async function FittingRoomPage({ searchParams }: FittingRoomPageProps) {
  const [allGarments, params] = await Promise.all([
    loadGarments(),
    searchParams,
  ]);

  return (
    <FittingRoomExperience
      garments={allGarments}
      initialShirtSlug={params.shirt}
    />
  );
}
