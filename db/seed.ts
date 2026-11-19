import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "./index";
import { garments, garmentVariants } from "./schema";

interface SeedShirt {
  slug: string;
  lotLabel: string;
  title: string;
  description: string;
  priceKobo: number;
  fabric: string;
  weightGsm: string;
  fit: string;
  sortOrder: number;
  variants: {
    size: "S" | "M" | "L" | "XL";
    chestSpec: string;
    lengthSpec: string;
    stockQty: number;
  }[];
}

const SEED_SHIRTS: SeedShirt[] = [
  {
    slug: "sky-floral-camp",
    lotLabel: "DROP 01 — SIGNATURE PIECE",
    title: "Sky Floral Camp Shirt",
    description:
      "Relaxed boxy camp-collar shirting cut for Lagos heat in raised 100% cotton floral matelassé jacquard with tonal buttons.",
    priceKobo: 6500000, // ₦65,000
    fabric: "100% Raised Cotton Jacquard",
    weightGsm: "215 GSM",
    fit: "Boxy Camp Collar",
    sortOrder: 1,
    variants: [
      { size: "S", chestSpec: 'Chest 42"', lengthSpec: 'Length 27.5"', stockQty: 6 },
      { size: "M", chestSpec: 'Chest 44"', lengthSpec: 'Length 28"', stockQty: 10 },
      { size: "L", chestSpec: 'Chest 46"', lengthSpec: 'Length 28.5"', stockQty: 8 },
      { size: "XL", chestSpec: 'Chest 48"', lengthSpec: 'Length 29"', stockQty: 5 },
    ],
  },
  {
    slug: "olive-damask-camp",
    lotLabel: "DROP 01 — ARCHIVAL JACQUARD",
    title: "Olive Damask Camp Shirt",
    description:
      "Heavyweight damask weave cotton jacquard tailored in an archival relaxed camp silhouette with horn buttons.",
    priceKobo: 9500000, // ₦95,000
    fabric: "100% Damask Weave Cotton Jacquard",
    weightGsm: "230 GSM",
    fit: "Relaxed Camp Collar",
    sortOrder: 2,
    variants: [
      { size: "S", chestSpec: 'Chest 42"', lengthSpec: 'Length 27.5"', stockQty: 5 },
      { size: "M", chestSpec: 'Chest 44"', lengthSpec: 'Length 28"', stockQty: 8 },
      { size: "L", chestSpec: 'Chest 46"', lengthSpec: 'Length 28.5"', stockQty: 7 },
      { size: "XL", chestSpec: 'Chest 48"', lengthSpec: 'Length 29"', stockQty: 4 },
    ],
  },
  {
    slug: "terracotta-geometric-camp",
    lotLabel: "DROP 01 — ARTISANAL WEAVE",
    title: "Terracotta Geometric Camp Shirt",
    description:
      "Textured cotton-linen woven in micro-geometric motifs, designed for airy breathability and structured drape.",
    priceKobo: 8200000, // ₦82,000
    fabric: "Woven Geometric Cotton-Linen",
    weightGsm: "210 GSM",
    fit: "Boxy Camp Collar",
    sortOrder: 3,
    variants: [
      { size: "S", chestSpec: 'Chest 42"', lengthSpec: 'Length 27.5"', stockQty: 6 },
      { size: "M", chestSpec: 'Chest 44"', lengthSpec: 'Length 28"', stockQty: 9 },
      { size: "L", chestSpec: 'Chest 46"', lengthSpec: 'Length 28.5"', stockQty: 8 },
      { size: "XL", chestSpec: 'Chest 48"', lengthSpec: 'Length 29"', stockQty: 5 },
    ],
  },
  {
    slug: "indigo-batik-camp",
    lotLabel: "DROP 01 — HERITAGE DYE",
    title: "Indigo Batik Camp Shirt",
    description:
      "Hand-dyed indigo batik wax resist print on premium structured cotton canvas, finished with matte coconut buttons.",
    priceKobo: 8800000, // ₦88,000
    fabric: "Hand-Dyed Indigo Batik Cotton",
    weightGsm: "220 GSM",
    fit: "Boxy Camp Collar",
    sortOrder: 4,
    variants: [
      { size: "S", chestSpec: 'Chest 42"', lengthSpec: 'Length 27.5"', stockQty: 4 },
      { size: "M", chestSpec: 'Chest 44"', lengthSpec: 'Length 28"', stockQty: 7 },
      { size: "L", chestSpec: 'Chest 46"', lengthSpec: 'Length 28.5"', stockQty: 6 },
      { size: "XL", chestSpec: 'Chest 48"', lengthSpec: 'Length 29"', stockQty: 3 },
    ],
  },
];

async function seed() {
  const db = getDb();
  if (!db) {
    throw new Error("DATABASE_URL is missing in .env.local");
  }

  for (const item of SEED_SHIRTS) {
    const existing = await db.select().from(garments).where(eq(garments.slug, item.slug)).limit(1);

    if (existing.length > 0) {
      console.log(`[SKIP] ${item.title} (${item.slug}) is already seeded.`);
      continue;
    }

    const [shirt] = await db
      .insert(garments)
      .values({
        slug: item.slug,
        lotLabel: item.lotLabel,
        title: item.title,
        description: item.description,
        priceKobo: item.priceKobo,
        fabric: item.fabric,
        weightGsm: item.weightGsm,
        fit: item.fit,
        sortOrder: item.sortOrder,
        frontImgUrl: `/assets/shirts/${item.slug}/front.webp`,
        sideImgUrl: `/assets/shirts/${item.slug}/side.webp`,
        backImgUrl: `/assets/shirts/${item.slug}/back.webp`,
        foldedImgUrl: `/assets/shirts/${item.slug}/folded.webp`,
      })
      .returning();

    await db.insert(garmentVariants).values(
      item.variants.map((v) => ({
        garmentId: shirt.id,
        size: v.size,
        chestSpec: v.chestSpec,
        lengthSpec: v.lengthSpec,
        stockQty: v.stockQty,
      }))
    );

    console.log(`[SEEDED] ${item.title} — ₦${(item.priceKobo / 100).toLocaleString()}`);
  }

  console.log("All garments and variants verified in Neon Postgres.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
