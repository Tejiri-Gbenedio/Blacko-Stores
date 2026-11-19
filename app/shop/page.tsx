import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { garments, garmentVariants } from "@/db/schema";
import { FALLBACK_GARMENTS } from "@/lib/fallback-garments";
import type { GarmentDTO } from "@/lib/types";
import ShopCatalog from "@/components/shop/ShopCatalog";
import StoreFooter from "@/components/layout/StoreFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop All — The Shirting Archive | Blacko Stores",
  description:
    "Explore small-batch contemporary Nigerian shirting. Filter by camp collar, raised jacquard, and hand-dyed adire batik, and pack directly into your custom Weekender Bag.",
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
    console.error("loadGarments database error:", err);
    return FALLBACK_GARMENTS;
  }
}

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    size?: string;
    sort?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const [initialGarments, params] = await Promise.all([
    loadGarments(),
    searchParams,
  ]);

  return (
    <div className="w-full relative">
      <ShopCatalog
        initialGarments={initialGarments}
        initialCategory={params.category}
        initialSize={params.size}
        initialSort={params.sort}
      />
      <StoreFooter />
    </div>
  );
}
