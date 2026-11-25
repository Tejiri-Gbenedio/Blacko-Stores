import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { garments, garmentVariants } from "@/db/schema";
import { FALLBACK_GARMENTS } from "@/lib/fallback-garments";
import type { GarmentDTO } from "@/lib/types";
import StoreFooter from "@/components/layout/StoreFooter";

export const metadata: Metadata = {
  title: "About & Atelier — Heritage Shirting | Blacko Stores",
  description:
    "Tailored for Lagos heat. Built to travel. Discover Blacko Stores' small-batch contemporary menswear, African jacquard weaves, and the Weekender Bag pack system.",
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
    console.error("About page loadGarments error:", err);
    return FALLBACK_GARMENTS;
  }
}

export default async function AboutPage() {
  const garmentsList = await loadGarments();

  return (
    <main className="w-full bg-[#F9F8F6] text-[#141413]">
      {/* 1. EDITORIAL HERO SECTION */}
      <section className="pt-20 md:pt-28 pb-16 md:pb-24 px-6 md:px-12 max-w-6xl mx-auto border-b border-[var(--hairline)]">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-muted)] mb-4">
            ABOUT BLACKO STORES • LAGOS
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal leading-[1.08] tracking-tight text-[#141413]">
            Tailored for Lagos heat.
            <br />
            <span className="italic">Built to travel.</span>
          </h1>
          <p className="mt-8 text-base md:text-lg text-[var(--ink-muted)] leading-relaxed font-sans max-w-2xl">
            Blacko Stores was conceived on the Atlantic edge of Lagos, Nigeria. We bridge
            centuries of West African textile mastery—tactile raised jacquards, indigenous
            indigo resist-dyeing, and crisp breathable cottons—with a relaxed, architectural
            camp silhouette engineered for tropical humidity and global movement.
          </p>
          <p className="mt-4 text-sm md:text-base text-[var(--ink-muted)] leading-relaxed font-sans max-w-2xl">
            Every garment is tailored in strictly numbered atelier drops in Lekki. No mass production.
            No overstock. Designed to live on the brass rail and pack flat into your Weekender Bag.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3.5 shop-primary text-xs uppercase font-medium tracking-[0.2em] transition"
            >
              Browse The Rail
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-6 py-3.5 border border-[var(--hairline)] text-[#141413] text-xs uppercase font-medium tracking-[0.2em] hover:border-[#141413] transition"
            >
              View Complete Archive
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THREE ATELIER PILLARS */}
      <section className="py-20 md:py-28 px-6 md:px-12 max-w-6xl mx-auto border-b border-[var(--hairline)]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-muted)] mb-2">
              FOUNDATIONAL PILLARS
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-[#141413]">
              The Blacko Shirting Discipline
            </h2>
          </div>
          <p className="text-xs font-mono text-[var(--ink-muted)] uppercase tracking-wider">
            ATELIER CODE • REV 2026
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Pillar 01 */}
          <div className="flex flex-col border-t border-[#141413] pt-6">
            <span className="font-mono text-xs font-medium tracking-[0.2em] text-[#141413] mb-4">
              01 / TEXTILE FIRST
            </span>
            <h3 className="font-serif text-2xl text-[#141413] mb-3">
              Heritage Weaves &amp; Hand-Dyeing
            </h3>
            <p className="text-sm text-[var(--ink-muted)] leading-relaxed font-sans">
              We source heavyweight 210–235 GSM breathable cottons, custom floral matelassé jacquards,
              and genuine Yoruba adire resist batiks. Heavy enough to drape with architectural
              substance, yet woven loosely enough to let equatorial sea breezes pass straight through.
            </p>
          </div>

          {/* Pillar 02 */}
          <div className="flex flex-col border-t border-[#141413] pt-6">
            <span className="font-mono text-xs font-medium tracking-[0.2em] text-[#141413] mb-4">
              02 / BOXY SILHOUETTE
            </span>
            <h3 className="font-serif text-2xl text-[#141413] mb-3">
              The Relaxed Camp Collar
            </h3>
            <p className="text-sm text-[var(--ink-muted)] leading-relaxed font-sans">
              Cut wide through the chest with clean dropped shoulders and a straight hemline that
              sits cleanly above the trouser pockets. Designed to be worn unbuttoned over a ribbed
              tank or buttoned to the collar for formal evening gatherings.
            </p>
          </div>

          {/* Pillar 03 */}
          <div className="flex flex-col border-t border-[#141413] pt-6">
            <span className="font-mono text-xs font-medium tracking-[0.2em] text-[#141413] mb-4">
              03 / THE WEEKENDER EXPERIENCE
            </span>
            <h3 className="font-serif text-2xl text-[#141413] mb-3">
              Fold-to-Bag Engineering
            </h3>
            <p className="text-sm text-[var(--ink-muted)] leading-relaxed font-sans">
              Every shirt is engineered to fold flat without losing its collar structure. Our
              signature digital-to-physical pack flow lets you curate 2 to 4 garments directly into
              the custom Weekender Bag, unlocking complete wardrobe mobility.
            </p>
          </div>
        </div>
      </section>

      {/* 3. ATELIER GARMENT SPRITE STRIP */}
      <section className="py-20 md:py-28 px-6 md:px-12 max-w-6xl mx-auto border-b border-[var(--hairline)]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-muted)] mb-2">
              CURRENT ATELIER ROSTER
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-[#141413]">
              Active Seasonal Silhouettes
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs uppercase font-mono tracking-[0.18em] text-[#141413] underline underline-offset-4 hover:opacity-75"
          >
            Explore All In Archive →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {garmentsList.slice(0, 4).map((garment, idx) => (
            <Link
              key={garment.id}
              href={`/shop?category=${encodeURIComponent(
                garment.title.toLowerCase().includes("batik")
                  ? "Adire Batik"
                  : garment.title.toLowerCase().includes("jacquard") || garment.title.toLowerCase().includes("damask")
                  ? "Jacquard"
                  : "Camp Shirts"
              )}`}
              className="group flex flex-col bg-[#F3F1EC] p-4 border border-[var(--hairline)] hover:border-[#141413] transition"
            >
              <div className="aspect-[3/4] relative w-full flex items-center justify-center overflow-hidden mb-4">
                <Image
                  src={garment.frontImgUrl}
                  alt={garment.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-contain p-2 group-hover:scale-105 transition-transform duration-500 ease-out"
                />
              </div>

              <div className="pt-2 border-t border-[var(--hairline)]">
                <p className="font-mono text-[10px] text-[var(--ink-muted)] uppercase tracking-wider">
                  0{idx + 1} • {garment.weightGsm}
                </p>
                <h4 className="font-serif text-base text-[#141413] mt-1 group-hover:underline line-clamp-1">
                  {garment.title}
                </h4>
                <p className="font-mono text-xs text-[#141413] mt-1">
                  ₦{(garment.priceKobo / 100).toLocaleString("en-NG")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. LEKKI STUDIO MANIFESTO BANNER */}
      <section className="py-20 md:py-28 px-6 md:px-12 max-w-4xl mx-auto text-center">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-muted)] mb-4">
          LEKKI PHASE 1 • LAGOS, NIGERIA
        </p>
        <blockquote className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#141413] font-normal leading-snug">
          “We do not design disposable streetwear. We build generational shirting that remembers
          where it came from and travels wherever you go.”
        </blockquote>
        <div className="mt-8 flex justify-center items-center gap-6">
          <Link
            href="/contact"
            className="text-xs uppercase font-mono tracking-[0.2em] text-[#141413] underline underline-offset-4 hover:opacity-75"
          >
            Visit Our Lekki Studio →
          </Link>
          <span className="text-xs text-[var(--ink-muted)]">•</span>
          <Link
            href="/shop"
            className="text-xs uppercase font-mono tracking-[0.2em] text-[#141413] underline underline-offset-4 hover:opacity-75"
          >
            Order Nationwide →
          </Link>
        </div>
      </section>

      {/* Shared Store Footer */}
      <div className="pb-24">
        <StoreFooter />
      </div>
    </main>
  );
}
