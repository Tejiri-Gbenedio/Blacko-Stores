"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { formatNaira } from "@/lib/currency";
import type { GarmentDTO, GarmentVariantDTO } from "@/lib/types";
import { useBag } from "@/components/bag/BagContext";
import StoreFooter from "@/components/layout/StoreFooter";

interface HomeCatalogFlowProps {
  garments: GarmentDTO[];
}

export default function HomeCatalogFlow({ garments }: HomeCatalogFlowProps) {
  const { addToBag, setDrawerOpen } = useBag();

  // Selected variant state per garment id
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    garments.forEach((g) => {
      const defaultVariant = g.variants.find((v) => v.stockQty > 0) || g.variants[0];
      if (defaultVariant) initial[g.id] = defaultVariant.id;
    });
    return initial;
  });

  // Track card image refs so flyToBag starts directly from the shirt card
  const cardImgRefs = useRef<Record<string, HTMLImageElement | null>>({});

  // Weekend pack garment pair
  const comboShirt1 = garments[0];
  const comboShirt2 = garments[3] || garments[1];
  const [comboVar1Id, setComboVar1Id] = useState<string>(
    comboShirt1?.variants[1]?.id || comboShirt1?.variants[0]?.id || ""
  );
  const [comboVar2Id, setComboVar2Id] = useState<string>(
    comboShirt2?.variants[1]?.id || comboShirt2?.variants[0]?.id || ""
  );
  const comboImg1Ref = useRef<HTMLImageElement | null>(null);
  const comboImg2Ref = useRef<HTMLImageElement | null>(null);

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

  async function handlePackCombo() {
    if (!comboShirt1 || !comboShirt2) return;
    const v1 = comboShirt1.variants.find((v) => v.id === comboVar1Id) || comboShirt1.variants[0];
    const v2 = comboShirt2.variants.find((v) => v.id === comboVar2Id) || comboShirt2.variants[0];

    if (v1 && comboImg1Ref.current) {
      await addToBag(v1.id, comboShirt1, v1, comboImg1Ref.current);
    }
    setTimeout(async () => {
      if (v2 && comboImg2Ref.current) {
        await addToBag(v2.id, comboShirt2, v2, comboImg2Ref.current);
      }
    }, 280);
  }

  return (
    <div className="w-full relative bg-[#F9F8F6]">
      {/* ========================================================= */}
      {/* SECTION 02: Studio Ticker & Manifesto Strip               */}
      {/* ========================================================= */}
      <section id="manifesto" className="w-full border-t border-[var(--hairline)]">
        {/* Hairline Marquee Ticker */}
        <div className="w-full border-b border-[var(--hairline)] py-3 overflow-hidden whitespace-nowrap bg-[#F9F8F6]">
          <div className="inline-flex animate-marquee gap-8 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--ink-muted)]">
            <span>LAGOS CRAFTED • SMALL-BATCH SHIRTING • 100% RAISED JACQUARD &amp; ADIRE • NATIONWIDE DELIVERY</span>
            <span>•</span>
            <span>LAGOS CRAFTED • SMALL-BATCH SHIRTING • 100% RAISED JACQUARD &amp; ADIRE • NATIONWIDE DELIVERY</span>
            <span>•</span>
            <span>LAGOS CRAFTED • SMALL-BATCH SHIRTING • 100% RAISED JACQUARD &amp; ADIRE • NATIONWIDE DELIVERY</span>
            <span>•</span>
            <span>LAGOS CRAFTED • SMALL-BATCH SHIRTING • 100% RAISED JACQUARD &amp; ADIRE • NATIONWIDE DELIVERY</span>
          </div>
        </div>

        {/* Clean Editorial Manifesto */}
        <div className="py-20 md:py-28 px-6 text-center max-w-4xl mx-auto">
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-[var(--ink-muted)] mb-5">
            STUDIO MANIFESTO • DROP 01
          </p>
          <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-[#141413] leading-[1.12]">
            &ldquo;Cut for Lagos heat. Packed for everywhere else.&rdquo;
          </h2>
          <p className="max-w-xl mx-auto mt-6 text-xs md:text-sm text-[var(--ink-muted)] leading-relaxed font-sans">
            Structured camp collars, breathable hand-loomed textiles, and raised jacquards woven for the coastal humidity of West Africa and warm evenings abroad.
          </p>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 03: The Continuous Studio Catalog (DROP 01)       */}
      {/* ========================================================= */}
      <section id="catalog" className="w-full px-6 md:px-10 py-16 md:py-24 border-t border-[var(--hairline)]">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-14 border-b border-[var(--hairline)] pb-5 gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--ink-muted)] mb-1.5">
              COLLECTION 01 • SHIRTING
            </p>
            <h3 className="font-editorial text-3xl md:text-4xl font-medium text-[#141413]">
              New In — Drop 01
            </h3>
          </div>
          <div className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
            {garments.length} Archival Silhouettes
          </div>
        </div>

        {/* 4-Column Desktop / 2-Column Mobile Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-7">
          {garments.map((garment) => {
            const currentVarId = selectedVariants[garment.id] || garment.variants[0]?.id;
            const currentVar = garment.variants.find((v) => v.id === currentVarId) || garment.variants[0];
            const totalStock = garment.variants.reduce((sum, v) => sum + v.stockQty, 0);

            return (
              <div
                key={garment.id}
                className="flex flex-col justify-between group/card bg-[#F9F8F6]"
              >
                {/* Visual Backdrop with Front/Back Crossfade */}
                <div className="aspect-[3/4] bg-[#F4F3F0] relative overflow-hidden border border-[#141413]/5 rounded-sm">
                  {/* Stock Pill Badge */}
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

                  {/* Primary Front Sprite */}
                  <img
                    ref={(el) => {
                      cardImgRefs.current[garment.id] = el;
                    }}
                    src={garment.frontImgUrl}
                    alt={garment.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain p-4 transition-all duration-500 ease-out group-hover/card:opacity-0 group-hover/card:scale-105"
                  />

                  {/* Secondary Back Sprite (Crossfades on Hover) */}
                  <img
                    src={garment.backImgUrl}
                    alt={`${garment.title} back view`}
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-contain p-4 opacity-0 transition-all duration-500 ease-out group-hover/card:opacity-100 group-hover/card:scale-105"
                  />
                </div>

                {/* Card Meta & Controls */}
                <div className="pt-3.5 pb-2 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="font-sans font-medium text-sm md:text-base text-[#141413] line-clamp-1">
                        {garment.title}
                      </h4>
                    </div>
                    <p className="font-mono text-xs md:text-sm text-[#141413]/85 mt-1">
                      {formatNaira(garment.priceKobo)}
                    </p>
                    <p className="text-[11px] text-[var(--ink-muted)] line-clamp-1 mt-0.5">
                      {garment.fabric} • {garment.fit} fit
                    </p>
                  </div>

                  {/* Inline Size Selector Pills */}
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

                    {/* Pack in Bag Button */}
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
      </section>

      {/* ========================================================= */}
      {/* SECTION 04: Best Worn Together (THE WEEKEND PACK)        */}
      {/* ========================================================= */}
      {comboShirt1 && comboShirt2 && (
        <section className="w-full px-6 md:px-10 py-16 md:py-24 border-t border-[var(--hairline)] bg-[#F4F3F0]/60">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-muted)] mb-2">
                CURATED BUNDLE • LOT 01 + 04
              </p>
              <h3 className="font-editorial text-3xl md:text-5xl font-medium text-[#141413]">
                The Weekend Pack
              </h3>
              <p className="text-xs md:text-sm text-[var(--ink-muted)] mt-3 leading-relaxed">
                Two distinct moods for 48 hours in Lagos. One crisp floral jacquard for sunny afternoon palm lounges, one deep indigo batik for nocturnal sound lounges.
              </p>
            </div>

            {/* Split Combo Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              {/* Left Shirt */}
              <div className="bg-[#F9F8F6] p-6 md:p-8 border border-[#141413]/10 rounded-sm flex flex-col justify-between">
                <div>
                  <div className="aspect-[4/3] bg-[#EFECE6] relative overflow-hidden rounded-sm mb-4">
                    <img
                      ref={comboImg1Ref}
                      src={comboShirt1.frontImgUrl}
                      alt={comboShirt1.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain p-4"
                    />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <h4 className="font-sans font-medium text-base text-[#141413]">
                      {comboShirt1.title}
                    </h4>
                    <span className="font-mono text-sm text-[#141413]/85">
                      {formatNaira(comboShirt1.priceKobo)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--ink-muted)] mt-1">{comboShirt1.fabric}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--hairline)]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-muted)] block mb-1.5">
                    Select Size:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {comboShirt1.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setComboVar1Id(v.id)}
                        className={
                          "px-2.5 py-1 text-[11px] font-mono uppercase rounded transition " +
                          (comboVar1Id === v.id
                            ? "bg-[#141413] text-[#F9F8F6] font-medium"
                            : "bg-white text-[#141413] border border-[#141413]/15")
                        }
                      >
                        {v.size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Shirt */}
              <div className="bg-[#F9F8F6] p-6 md:p-8 border border-[#141413]/10 rounded-sm flex flex-col justify-between">
                <div>
                  <div className="aspect-[4/3] bg-[#EFECE6] relative overflow-hidden rounded-sm mb-4">
                    <img
                      ref={comboImg2Ref}
                      src={comboShirt2.frontImgUrl}
                      alt={comboShirt2.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain p-4"
                    />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <h4 className="font-sans font-medium text-base text-[#141413]">
                      {comboShirt2.title}
                    </h4>
                    <span className="font-mono text-sm text-[#141413]/85">
                      {formatNaira(comboShirt2.priceKobo)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--ink-muted)] mt-1">{comboShirt2.fabric}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--hairline)]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-muted)] block mb-1.5">
                    Select Size:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {comboShirt2.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setComboVar2Id(v.id)}
                        className={
                          "px-2.5 py-1 text-[11px] font-mono uppercase rounded transition " +
                          (comboVar2Id === v.id
                            ? "bg-[#141413] text-[#F9F8F6] font-medium"
                            : "bg-white text-[#141413] border border-[#141413]/15")
                        }
                      >
                        {v.size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Combined Action Bar */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 md:p-6 bg-[#141413] text-[#F9F8F6] rounded-sm">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A6A49F]">
                  BUNDLE PRICING • 2 ARCHIVAL SHIRTS
                </p>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="font-editorial text-2xl md:text-3xl font-medium">
                    {formatNaira(comboShirt1.priceKobo + comboShirt2.priceKobo)}
                  </span>
                  <span className="text-xs font-mono text-[#A6A49F]">Nationwide Delivery Included</span>
                </div>
              </div>

              <button
                onClick={handlePackCombo}
                className="w-full sm:w-auto px-7 py-3.5 bg-[#F9F8F6] text-[#141413] hover:bg-white text-xs uppercase tracking-[0.18em] font-medium transition shadow flex items-center justify-center gap-3 rounded-sm active:scale-95"
              >
                <span>Pack Both into Bag</span>
                <span className="font-mono text-sm">↘</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* SECTION 05: Dark Obsidian Category Runway                 */}
      {/* ========================================================= */}
      <section className="w-full bg-[#141413] text-[#F9F8F6] py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-[#A6A49F] mb-10 md:mb-14">
            EXPLORE THE TEXTILE ARCHIVE
          </p>

          <div className="flex flex-col divide-y divide-[#F9F8F6]/15 border-y border-[#F9F8F6]/15">
            {[
              { title: "CAMP SHIRTS", meta: "Relaxed Boxy Fit • Open Collar", count: "04 Designs", href: "/shop?category=camp-shirts" },
              { title: "JACQUARD", meta: "Heavyweight Raised Floral Weaves", count: "02 Textures", href: "/shop?category=jacquard" },
              { title: "ADIRE BATIK", meta: "Hand-Dyed Indigo & Terracotta Wax Resist", count: "02 Patterns", href: "/shop?category=adire-batik" },
              { title: "SHOP ALL →", meta: "Complete Lagos Production Run", count: "Drop 01", href: "/shop" },
            ].map((cat) => (
              <Link
                key={cat.title}
                href={cat.href}
                className="group flex flex-col md:flex-row md:items-center justify-between py-6 md:py-8 transition-colors hover:text-[#FFFFFF]"
              >
                <div className="flex items-baseline gap-6">
                  <span className="font-editorial text-4xl sm:text-5xl md:text-7xl font-medium tracking-tight text-[#F9F8F6]/85 group-hover:text-white transition-all group-hover:translate-x-2">
                    {cat.title}
                  </span>
                  <span className="hidden sm:inline font-mono text-xs uppercase tracking-wider text-[#A6A49F]">
                    {cat.meta}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.16em] text-[#A6A49F] group-hover:text-white mt-2 md:mt-0">
                  <span>{cat.count}</span>
                  <span className="text-base group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 06: Blacko Stores Lagos Footer (Shared Component) */}
      {/* ========================================================= */}
      <StoreFooter />
    </div>
  );
}
