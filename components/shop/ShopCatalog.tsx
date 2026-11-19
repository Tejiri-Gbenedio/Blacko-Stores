"use client";

import React, { useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatNaira } from "@/lib/currency";
import type { GarmentDTO } from "@/lib/types";
import { useBag } from "@/components/bag/BagContext";
import QuickInspectModal from "./QuickInspectModal";

interface ShopCatalogProps {
  initialGarments: GarmentDTO[];
  initialCategory?: string;
  initialSize?: string;
  initialSort?: string;
}

const CATEGORIES = [
  { id: "all", label: "All Products" },
  { id: "camp-shirts", label: "Camp Shirts" },
  { id: "jacquard", label: "Jacquard" },
  { id: "adire-batik", label: "Adire Batik" },
];

const SIZES = ["All", "S", "M", "L", "XL"];

export default function ShopCatalog({
  initialGarments,
  initialCategory,
  initialSize,
  initialSort,
}: ShopCatalogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToBag } = useBag();

  // Instant local state with URL synchronization
  const [category, setCategory] = useState(
    searchParams.get("category") || initialCategory || "all"
  );
  const [size, setSize] = useState(
    searchParams.get("size") || initialSize || "All"
  );
  const [sort, setSort] = useState(
    searchParams.get("sort") || initialSort || "featured"
  );

  // Sync state if searchParams change externally (e.g. back button or direct navigation)
  React.useEffect(() => {
    const c = searchParams.get("category") || initialCategory || "all";
    const s = searchParams.get("size") || initialSize || "All";
    const o = searchParams.get("sort") || initialSort || "featured";
    setCategory(c);
    setSize(s);
    setSort(o);
  }, [searchParams, initialCategory, initialSize, initialSort]);

  // Selected variant per garment card
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    initialGarments.forEach((g) => {
      const def = g.variants.find((v) => v.stockQty > 0) || g.variants[0];
      if (def) map[g.id] = def.id;
    });
    return map;
  });

  // Card image refs for flyToBag
  const cardImgRefs = useRef<Record<string, HTMLImageElement | null>>({});

  // Quick Inspect Modal state
  const [inspectGarment, setInspectGarment] = useState<GarmentDTO | null>(null);

  // Sync URL query params without scroll jumping
  function updateParams(newParams: { category?: string; size?: string; sort?: string }) {
    const nextCat = newParams.category !== undefined ? newParams.category : category;
    const nextSize = newParams.size !== undefined ? newParams.size : size;
    const nextSort = newParams.sort !== undefined ? newParams.sort : sort;

    if (newParams.category !== undefined) setCategory(newParams.category);
    if (newParams.size !== undefined) setSize(newParams.size);
    if (newParams.sort !== undefined) setSort(newParams.sort);

    const params = new URLSearchParams();
    if (nextCat !== "all") params.set("category", nextCat);
    if (nextSize !== "All") params.set("size", nextSize);
    if (nextSort !== "featured") params.set("sort", nextSort);

    const q = params.toString();
    const targetUrl = `/shop${q ? `?${q}` : ""}`;
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", targetUrl);
    }
    router.replace(targetUrl, { scroll: false });
  }

  // Filter & sort logic
  const filteredGarments = useMemo(() => {
    return initialGarments
      .filter((g) => {
        // Category filtering
        if (category === "camp-shirts") {
          const match =
            g.fit.toLowerCase().includes("camp") ||
            g.title.toLowerCase().includes("camp") ||
            g.description.toLowerCase().includes("camp");
          if (!match) return false;
        } else if (category === "jacquard") {
          const match =
            g.fabric.toLowerCase().includes("jacquard") ||
            g.title.toLowerCase().includes("jacquard") ||
            g.lotLabel.toLowerCase().includes("jacquard");
          if (!match) return false;
        } else if (category === "adire-batik" || category === "adire" || category === "batik") {
          const match =
            g.fabric.toLowerCase().includes("batik") ||
            g.fabric.toLowerCase().includes("adire") ||
            g.title.toLowerCase().includes("batik") ||
            g.title.toLowerCase().includes("geometric") ||
            g.description.toLowerCase().includes("batik") ||
            g.lotLabel.toLowerCase().includes("dye") ||
            g.lotLabel.toLowerCase().includes("artisanal");
          if (!match) return false;
        }

        // Size filtering
        if (size !== "All") {
          const hasInStockSize = g.variants.some(
            (v) => v.size.toUpperCase() === size.toUpperCase() && v.stockQty > 0
          );
          if (!hasInStockSize) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sort === "price-asc") return a.priceKobo - b.priceKobo;
        if (sort === "price-desc") return b.priceKobo - a.priceKobo;
        return a.sortOrder - b.sortOrder;
      });
  }, [category, size, sort, initialGarments]);

  function handleSelectVariant(garmentId: string, variantId: string) {
    setSelectedVariants((prev) => ({ ...prev, [garmentId]: variantId }));
  }

  async function handlePackCard(garment: GarmentDTO) {
    const vId = selectedVariants[garment.id] || garment.variants[0]?.id;
    const variant = garment.variants.find((v) => v.id === vId) || garment.variants[0];
    if (!variant) return;

    const sourceEl = cardImgRefs.current[garment.id];
    await addToBag(variant.id, garment, variant, sourceEl);
  }

  return (
    <div className="w-full relative min-h-screen bg-[#F9F8F6]">
      {/* 1. Page Header */}
      <section className="pt-12 md:pt-16 pb-8 md:pb-12 px-6 md:px-10 border-b border-[var(--hairline)]">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-muted)] mb-2">
            SMALL-BATCH LAGOS SHIRTING • PACK DIRECTLY INTO YOUR WEEKENDER BAG
          </p>
          <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
            <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-[#141413]">
              The Shirting Archive
            </h1>
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
              {filteredGarments.length} {filteredGarments.length === 1 ? "Piece" : "Pieces"} Available
            </span>
          </div>
        </div>
      </section>

      {/* 2. Loom & Co.-Inspired Sticky Filter & Sort Sub-Bar */}
      <div className="sticky top-16 md:top-18 z-30 bg-[#F9F8F6]/95 backdrop-blur-md border-b border-[var(--hairline)] px-6 md:px-10 transition-shadow">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 py-3.5">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => updateParams({ category: cat.id })}
                  className={
                    "text-xs uppercase tracking-[0.2em] font-medium py-1 whitespace-nowrap transition relative " +
                    (isSelected
                      ? "text-[#141413]"
                      : "text-[var(--ink-muted)] hover:text-[#141413]")
                  }
                >
                  <span>{cat.label}</span>
                  {isSelected && (
                    <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#141413]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Controls: Size Pills & Price Sort */}
          <div className="flex items-center justify-between md:justify-end gap-5">
            {/* Size Filter Pills */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] hidden lg:inline mr-1">
                Size:
              </span>
              {SIZES.map((sz) => {
                const isSelected = size === sz;
                return (
                  <button
                    key={sz}
                    onClick={() => updateParams({ size: sz })}
                    className={
                      "px-2.5 py-1 text-[11px] font-mono uppercase rounded transition " +
                      (isSelected
                        ? "bg-[#141413] text-[#F9F8F6] font-medium shadow-sm"
                        : "bg-white text-[#141413] border border-[#141413]/15 hover:border-[#141413]")
                    }
                  >
                    {sz}
                  </button>
                );
              })}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="shop-sort" className="sr-only">
                Sort By
              </label>
              <select
                id="shop-sort"
                value={sort}
                onChange={(e) => updateParams({ sort: e.target.value })}
                className="bg-white border border-[#141413]/20 text-[#141413] text-[11px] font-mono uppercase px-3 py-1.5 rounded-sm focus:outline-none focus:border-[#141413] cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Studio Product Grid */}
      <main className="max-w-6xl mx-auto px-6 md:px-10 pt-10 pb-36">
        {filteredGarments.length === 0 ? (
          /* Empty State */
          <div className="py-24 text-center max-w-md mx-auto">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)] mb-3">
              ZERO RESULTS
            </p>
            <h3 className="font-editorial text-3xl font-medium text-[#141413]">
              No garments match this filter
            </h3>
            <p className="text-xs text-[var(--ink-muted)] mt-2 mb-6">
              Try choosing another size or category from the archive.
            </p>
            <button
              onClick={() => updateParams({ category: "all", size: "All", sort: "featured" })}
              className="px-6 py-2.5 bg-[#141413] text-[#F9F8F6] text-xs uppercase tracking-[0.18em] font-medium hover:bg-[#2B2B28] transition rounded-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-7">
            {filteredGarments.map((garment) => {
              const currentVarId = selectedVariants[garment.id] || garment.variants[0]?.id;
              const currentVar =
                garment.variants.find((v) => v.id === currentVarId) || garment.variants[0];
              const totalStock = garment.variants.reduce((sum, v) => sum + v.stockQty, 0);

              return (
                <div
                  key={garment.id}
                  className="flex flex-col justify-between group/card bg-[#F9F8F6]"
                >
                  {/* Visual Studio Frame */}
                  <div className="aspect-[3/4] bg-[#F4F3F0] relative overflow-hidden border border-[#141413]/5 rounded-sm">
                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 z-20">
                      {totalStock < 10 ? (
                        <span className="bg-[#141413] text-[#F9F8F6] text-[10px] font-mono uppercase tracking-[0.15em] px-2.5 py-1 rounded-full shadow-sm">
                          Low Stock • {totalStock}
                        </span>
                      ) : (
                        <span className="bg-[#141413] text-[#F9F8F6] text-[10px] font-mono uppercase tracking-[0.15em] px-2.5 py-1 rounded-full shadow-sm">
                          New In
                        </span>
                      )}
                    </div>

                    {/* Quick Inspect Hover Button */}
                    <button
                      onClick={() => setInspectGarment(garment)}
                      className="absolute bottom-3 left-3 right-3 z-20 py-2 bg-white/90 backdrop-blur-sm text-[#141413] text-[10px] font-mono uppercase tracking-[0.18em] border border-[#141413]/15 opacity-0 group-hover/card:opacity-100 transition-opacity shadow-sm hover:bg-[#141413] hover:text-[#F9F8F6]"
                    >
                      Quick Inspect
                    </button>

                    {/* Primary Front Sprite */}
                    <img
                      ref={(el) => {
                        cardImgRefs.current[garment.id] = el;
                      }}
                      src={garment.frontImgUrl}
                      alt={garment.title}
                      onClick={() => setInspectGarment(garment)}
                      className="w-full h-full object-contain p-4 transition-all duration-500 ease-out group-hover/card:opacity-0 group-hover/card:scale-105 cursor-pointer"
                    />

                    {/* Secondary Back Sprite on Hover */}
                    <img
                      src={garment.backImgUrl}
                      alt={`${garment.title} back view`}
                      aria-hidden="true"
                      onClick={() => setInspectGarment(garment)}
                      className="absolute inset-0 w-full h-full object-contain p-4 opacity-0 transition-all duration-500 ease-out group-hover/card:opacity-100 group-hover/card:scale-105 cursor-pointer"
                    />
                  </div>

                  {/* Card Info & Inline Actions */}
                  <div className="pt-3.5 pb-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4
                        onClick={() => setInspectGarment(garment)}
                        className="font-sans font-medium text-sm md:text-base text-[#141413] line-clamp-1 hover:opacity-75 transition cursor-pointer"
                      >
                        {garment.title}
                      </h4>
                      <p className="font-mono text-xs md:text-sm text-[#141413]/85 mt-1">
                        {formatNaira(garment.priceKobo)}
                      </p>
                      <p className="text-[11px] text-[var(--ink-muted)] line-clamp-1 mt-0.5">
                        {garment.fabric} • {garment.fit}
                      </p>
                    </div>

                    {/* Size Selector Pills */}
                    <div className="mt-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {garment.variants.map((v) => {
                          const isSelected = v.id === currentVarId;
                          const isOos = v.stockQty <= 0;
                          return (
                            <button
                              key={v.id}
                              disabled={isOos}
                              onClick={() => handleSelectVariant(garment.id, v.id)}
                              className={
                                "px-2.5 py-1 text-[11px] font-mono uppercase rounded transition " +
                                (isOos
                                  ? "opacity-30 cursor-not-allowed line-through bg-transparent border border-[#141413]/10"
                                  : isSelected
                                  ? "bg-[#141413] text-[#F9F8F6] font-medium shadow-sm"
                                  : "bg-white text-[#141413] border border-[#141413]/15 hover:border-[#141413]")
                              }
                            >
                              {v.size}
                            </button>
                          );
                        })}
                      </div>

                      {/* Pack in Bag Action Button */}
                      <button
                        onClick={() => handlePackCard(garment)}
                        className="w-full mt-3 py-2.5 px-4 bg-[#141413] text-[#F9F8F6] text-xs uppercase tracking-[0.16em] font-medium hover:bg-[#2B2B28] active:scale-[0.98] transition flex items-center justify-between group/btn shadow-sm rounded-sm"
                      >
                        <span>Pack in Bag</span>
                        <span className="font-mono text-xs group-hover/btn:translate-x-0.5 group-hover/btn:translate-y-0.5 transition-transform">
                          ↘
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 4. Quick Inspect Modal Lightbox */}
      <QuickInspectModal
        garment={inspectGarment}
        onClose={() => setInspectGarment(null)}
      />
    </div>
  );
}
