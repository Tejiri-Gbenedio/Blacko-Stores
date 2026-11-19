import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { garments, garmentVariants } from "@/db/schema";
import { FALLBACK_GARMENTS } from "@/lib/fallback-garments";
import type { GarmentDTO } from "@/lib/types";
import BoutiqueExperience from "@/components/rack/BoutiqueExperience";
import HomeCatalogFlow from "@/components/home/HomeCatalogFlow";

export const dynamic = "force-dynamic";

async function loadInitialGarments(): Promise<GarmentDTO[]> {
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
    console.error("loadInitialGarments database error:", err);
    return FALLBACK_GARMENTS;
  }
}

export default async function HomePage() {
  const initialGarments = await loadInitialGarments();
  return (
    <main className="w-full relative">
      {/* Section 01: Pinned Hero Shirting Rail */}
      <BoutiqueExperience garments={initialGarments} />

      {/* Sections 02–06: Continuous Editorial Flow */}
      <HomeCatalogFlow garments={initialGarments} />
    </main>
  );
}
