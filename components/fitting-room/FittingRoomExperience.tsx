"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatNaira } from "@/lib/currency";
import type { GarmentDTO, GarmentVariantDTO } from "@/lib/types";
import { useBag } from "@/components/bag/BagContext";
import StoreFooter from "@/components/layout/StoreFooter";

interface FittingRoomExperienceProps {
  garments: GarmentDTO[];
  initialShirtSlug?: string;
}

type ModelId = "kenji" | "ren";
type Angle = "front" | "back";

interface ModelSpec {
  id: ModelId;
  name: string;
  height: string;
  size: string;
  defaultSize: string;
  styling: string;
  fitNote: string;
}

const MODELS: Record<ModelId, ModelSpec> = {
  kenji: {
    id: "kenji",
    name: "Kenji",
    height: "6'1\"",
    size: "Size L",
    defaultSize: "L",
    styling: "Buttoned-Up Styling",
    fitNote: "Kenji is 6'1\" wearing Size L — Buttoned-Up Boxy Camp Collar",
  },
  ren: {
    id: "ren",
    name: "Ren",
    height: "5'11\"",
    size: "Size M",
    defaultSize: "M",
    styling: "Unbuttoned Over Ribbed Tank",
    fitNote: "Ren is 5'11\" wearing Size M — Unbuttoned Over Ribbed Tank",
  },
};

export default function FittingRoomExperience({
  garments,
  initialShirtSlug,
}: FittingRoomExperienceProps) {
  const { addToBag } = useBag();

  // Selected Model: Kenji vs Ren
  const [model, setModel] = useState<ModelId>("kenji");

  // Selected Shirt: slug or null (Base Look)
  const defaultSlug =
    initialShirtSlug && garments.some((g) => g.slug === initialShirtSlug)
      ? initialShirtSlug
      : garments[0]?.slug || null;
  const [shirtSlug, setShirtSlug] = useState<string | null>(defaultSlug);

  // Selected Angle: Front vs Back
  const [angle, setAngle] = useState<Angle>("front");

  // Active Garment
  const activeGarment = garments.find((g) => g.slug === shirtSlug) || null;

  // Selected Variant (Size) for packing
  const [selectedVariantId, setSelectedVariantId] = useState<string>(() => {
    if (!activeGarment) return "";
    const preferred = activeGarment.variants.find(
      (v) => v.size === MODELS[model].defaultSize && v.stockQty > 0
    );
    return preferred ? preferred.id : activeGarment.variants[0]?.id || "";
  });

  // Reference to model image element for flyToBag animation
  const modelImgRef = useRef<HTMLImageElement | null>(null);

  // Crossfade image state
  const [isCrossfading, setIsCrossfading] = useState(false);
  const [displayedSrc, setDisplayedSrc] = useState<string>(() => {
    return shirtSlug
      ? `/assets/fitting-room/${model}/${shirtSlug}-${angle}.webp`
      : `/assets/fitting-room/${model}/base-front.webp`;
  });

  // Calculate target image src
  const targetSrc = shirtSlug
    ? `/assets/fitting-room/${model}/${shirtSlug}-${angle}.webp`
    : `/assets/fitting-room/${model}/base-front.webp`;

  // Preload all assets for instant zero-latency swapping
  useEffect(() => {
    const urls: string[] = [];
    (["kenji", "ren"] as ModelId[]).forEach((m) => {
      urls.push(`/assets/fitting-room/${m}/base-front.webp`);
      garments.forEach((g) => {
        urls.push(`/assets/fitting-room/${m}/${g.slug}-front.webp`);
        urls.push(`/assets/fitting-room/${m}/${g.slug}-back.webp`);
      });
    });

    urls.forEach((url) => {
      const img = new window.Image();
      img.src = url;
    });
  }, [garments]);

  // Handle smooth image crossfade
  useEffect(() => {
    if (targetSrc !== displayedSrc) {
      setIsCrossfading(true);
      const timer = setTimeout(() => {
        setDisplayedSrc(targetSrc);
        setIsCrossfading(false);
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [targetSrc, displayedSrc]);

  // Update selected variant when garment or model changes
  useEffect(() => {
    if (!activeGarment) return;
    const preferred = activeGarment.variants.find(
      (v) => v.size === MODELS[model].defaultSize && v.stockQty > 0
    );
    const fallback =
      activeGarment.variants.find((v) => v.stockQty > 0) ||
      activeGarment.variants[0];
    setSelectedVariantId(preferred ? preferred.id : fallback ? fallback.id : "");
  }, [activeGarment, model]);

  // Active Variant object
  const activeVariant =
    activeGarment?.variants.find((v) => v.id === selectedVariantId) ||
    activeGarment?.variants[0] ||
    null;

  // Pack in bag handler
  const [isPacking, setIsPacking] = useState(false);
  async function handlePackInBag() {
    if (!activeGarment || !activeVariant || activeVariant.stockQty < 1) return;
    setIsPacking(true);
    try {
      await addToBag(
        activeVariant.id,
        activeGarment,
        activeVariant,
        modelImgRef.current
      );
    } finally {
      setIsPacking(false);
    }
  }

  // Switch model and adapt size preference
  function handleSelectModel(newModel: ModelId) {
    setModel(newModel);
  }

  // Select shirt
  function handleSelectShirt(slug: string | null) {
    setShirtSlug(slug);
    if (!slug) {
      setAngle("front"); // Base look is front only
    }
  }

  return (
    <div className="w-full min-h-screen bg-[#F9F8F6] text-[#141413] flex flex-col">
      {/* Top Breadcrumb Bar */}
      <div className="w-full border-b border-[var(--hairline)] bg-[#F4F3F0]/70 px-6 md:px-12 py-3 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-[var(--ink-muted)]">
          <Link href="/" className="hover:text-[#141413] transition uppercase tracking-wider">
            Atelier
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[#141413] transition uppercase tracking-wider">
            Archive
          </Link>
          <span>/</span>
          <span className="text-[#141413] uppercase tracking-wider font-medium">
            Fitting Room
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] uppercase tracking-wider text-[var(--ink-muted)]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Interactive Try-On • Lekki Studio</span>
        </div>
      </div>

      {/* Main Studio Fitting Room Grid */}
      <main className="w-full flex-1 max-w-7xl mx-auto px-6 md:px-12 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* ========================================================= */}
          {/* LEFT COLUMN (55%): THE STUDIO MODEL STAGE                 */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* The Visual Studio Frame */}
            <div className="w-full relative aspect-[3/4] max-h-[78vh] lg:max-h-[82vh] bg-[#F4F3F0] border border-[#141413]/12 rounded-sm overflow-hidden flex items-center justify-center shadow-sm">
              {/* Floating Top Controls Bar inside Stage */}
              <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between pointer-events-auto">
                {/* 1. Model Switcher Pill */}
                <div className="inline-flex items-center bg-white/90 backdrop-blur-md border border-[#141413]/15 p-1 rounded-sm shadow-sm">
                  <button
                    onClick={() => handleSelectModel("kenji")}
                    className={
                      "px-3 py-1.5 text-xs font-mono uppercase tracking-[0.16em] transition rounded-xs " +
                      (model === "kenji"
                        ? "bg-[#141413] text-[#F9F8F6] font-medium shadow-sm"
                        : "text-[#141413]/70 hover:text-[#141413]")
                    }
                  >
                    Kenji
                  </button>
                  <button
                    onClick={() => handleSelectModel("ren")}
                    className={
                      "px-3 py-1.5 text-xs font-mono uppercase tracking-[0.16em] transition rounded-xs " +
                      (model === "ren"
                        ? "bg-[#141413] text-[#F9F8F6] font-medium shadow-sm"
                        : "text-[#141413]/70 hover:text-[#141413]")
                    }
                  >
                    Ren
                  </button>
                </div>

                {/* 2. Angle Switcher Pill */}
                <div className="inline-flex items-center bg-white/90 backdrop-blur-md border border-[#141413]/15 p-1 rounded-sm shadow-sm">
                  <button
                    onClick={() => setAngle("front")}
                    className={
                      "px-3 py-1.5 text-xs font-mono uppercase tracking-[0.16em] transition rounded-xs " +
                      (angle === "front"
                        ? "bg-[#141413] text-[#F9F8F6] font-medium shadow-sm"
                        : "text-[#141413]/70 hover:text-[#141413]")
                    }
                  >
                    Front
                  </button>
                  <button
                    onClick={() => setAngle("back")}
                    disabled={shirtSlug === null}
                    className={
                      "px-3 py-1.5 text-xs font-mono uppercase tracking-[0.16em] transition rounded-xs " +
                      (shirtSlug === null
                        ? "opacity-30 cursor-not-allowed text-[#141413]/40"
                        : angle === "back"
                        ? "bg-[#141413] text-[#F9F8F6] font-medium shadow-sm"
                        : "text-[#141413]/70 hover:text-[#141413]")
                    }
                  >
                    Back
                  </button>
                </div>
              </div>

              {/* Model Image with Smooth Crossfade */}
              <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
                <img
                  ref={modelImgRef}
                  src={displayedSrc}
                  alt={`${MODELS[model].name} modeling ${activeGarment ? activeGarment.title : "Base Look"} (${angle} view)`}
                  className={
                    "w-full h-full object-contain transition-opacity duration-200 ease-out " +
                    (isCrossfading ? "opacity-40 scale-[0.99]" : "opacity-100 scale-100")
                  }
                />
              </div>

              {/* Floating Bottom Model Fit Readout */}
              <div className="absolute bottom-4 inset-x-4 z-20 flex justify-center pointer-events-none">
                <div className="px-4 py-2 bg-white/90 backdrop-blur-md border border-[#141413]/15 text-center shadow-sm rounded-sm">
                  <p className="font-mono text-[11px] text-[#141413]">
                    {MODELS[model].fitNote}
                  </p>
                </div>
              </div>
            </div>

            {/* Studio Model Specs Sub-Strip */}
            <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ink-muted)] px-1">
              <span>Model Height: {MODELS[model].height}</span>
              <span>Styled In: {MODELS[model].size}</span>
              <span className="hidden sm:inline">Lagos Daylight Studio</span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN (45%): SHIRT SELECTOR & PACKING CONTROLS     */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-8 lg:max-w-[400px] pb-36">
            <div>
              {/* Header */}
              <div className="border-b border-[var(--hairline)] pb-5">
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-muted)] mb-2">
                  ATELIER FITTING ROOM • VIRTUAL TRY-ON
                </p>
                <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#141413]">
                  Lagos Studio Silhouettes
                </h1>
                <p className="text-xs md:text-sm text-[var(--ink-muted)] mt-2 leading-relaxed">
                  Explore proportional drape, texture contrast, and collar structure on studio models Kenji and Ren before packing into your Weekender.
                </p>
              </div>

              {/* 2×2 Garment Thumbnails Grid */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#141413] font-medium">
                    Select Silhouette ({garments.length})
                  </span>
                  <button
                    onClick={() => handleSelectShirt(null)}
                    className={
                      "text-[11px] font-mono uppercase tracking-wider underline underline-offset-4 transition " +
                      (shirtSlug === null
                        ? "text-[#141413] font-semibold"
                        : "text-[var(--ink-muted)] hover:text-[#141413]")
                    }
                  >
                    Reset to Base Look
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {garments.map((g) => {
                    const isSelected = g.slug === shirtSlug;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => handleSelectShirt(g.slug)}
                        className={
                          "p-3 rounded-sm text-left transition flex items-center gap-3 border " +
                          (isSelected
                            ? "bg-white border-[#141413] ring-1 ring-[#141413] shadow-sm"
                            : "bg-[#F7F5F0] border-[#141413]/10 hover:border-[#141413]/40")
                        }
                      >
                        <div className="w-12 h-14 bg-[#EFECE6] border border-[#141413]/5 rounded-xs p-1 flex-shrink-0 flex items-center justify-center">
                          <img
                            src={g.frontImgUrl}
                            alt={g.title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-sans text-xs font-medium text-[#141413] truncate">
                            {g.title}
                          </h3>
                          <p className="font-mono text-[11px] text-[#141413]/80 mt-0.5">
                            {formatNaira(g.priceKobo)}
                          </p>
                          <span className="text-[10px] text-[var(--ink-muted)] line-clamp-1">
                            {g.fit}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Shirt Spec Panel */}
              {activeGarment ? (
                <div className="mt-8 pt-6 border-t border-[var(--hairline)] space-y-4">
                  <div>
                    <div className="flex items-baseline justify-between">
                      <h2 className="font-editorial text-2xl font-medium text-[#141413]">
                        {activeGarment.title}
                      </h2>
                      <span className="font-mono text-base font-semibold text-[#141413]">
                        {formatNaira(activeGarment.priceKobo)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--ink-muted)] leading-relaxed mt-1">
                      {activeGarment.description}
                    </p>
                  </div>

                  {/* Spec Row */}
                  <div className="grid grid-cols-3 gap-3 py-3 border-y border-[var(--hairline)] text-xs font-mono">
                    <div>
                      <span className="text-[10px] uppercase text-[var(--ink-muted)] block">
                        Fabric
                      </span>
                      <span className="text-[#141413] font-sans font-medium line-clamp-1">
                        {activeGarment.fabric}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-[var(--ink-muted)] block">
                        Weight
                      </span>
                      <span className="text-[#141413]">{activeGarment.weightGsm}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-[var(--ink-muted)] block">
                        Fit
                      </span>
                      <span className="text-[#141413] font-sans">{activeGarment.fit}</span>
                    </div>
                  </div>

                  {/* Size Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                        Select Sizing (Live Atelier Stock)
                      </span>
                      {activeVariant && (
                        <span className="font-mono text-[10px] text-[#141413]">
                          {activeVariant.chestSpec} • {activeVariant.lengthSpec}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {activeGarment.variants.map((v) => {
                        const isSelected = v.id === selectedVariantId;
                        const isSoldOut = v.stockQty < 1;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            disabled={isSoldOut}
                            onClick={() => setSelectedVariantId(v.id)}
                            className={
                              "py-2.5 text-xs font-mono uppercase transition rounded-sm border " +
                              (isSelected
                                ? "bg-[#141413] text-[#F9F8F6] border-[#141413] font-semibold shadow-sm"
                                : "bg-white text-[#141413] border-[#141413]/20 hover:border-[#141413]") +
                              (isSoldOut ? " opacity-30 line-through cursor-not-allowed bg-transparent" : "")
                            }
                          >
                            <span>{v.size}</span>
                            <span className="block text-[9px] opacity-70">
                              {isSoldOut ? "Sold Out" : `${v.stockQty} left`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Base Look State */
                <div className="mt-8 pt-6 border-t border-[var(--hairline)] p-5 bg-[#F2EFE9] rounded-sm text-center">
                  <p className="font-mono text-xs uppercase tracking-wider text-[#141413] font-medium">
                    Base Model Undershirt View
                  </p>
                  <p className="text-xs text-[var(--ink-muted)] mt-1 max-w-sm mx-auto">
                    {MODELS[model].name} is shown in baseline high-waist pleated trousers. Select any shirting piece above to preview drape and proportions.
                  </p>
                </div>
              )}
            </div>

            {/* Call To Action Button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handlePackInBag}
                disabled={!activeGarment || !activeVariant || activeVariant.stockQty < 1 || isPacking}
                className="w-full lg:max-w-[255px] py-4 bg-[#141413] text-[#F9F8F6] text-xs uppercase tracking-[0.16em] font-medium hover:bg-[#2B2B28] disabled:opacity-40 transition flex items-center justify-between px-5 shadow-md rounded-sm active:scale-[0.99]"
              >
                <span>
                  {shirtSlug === null
                    ? "Select Silhouette"
                    : isPacking
                    ? "Packing in Bag..."
                    : `Pack This Fit In Bag`}
                </span>
                <span className="font-mono text-sm">↘</span>
              </button>

              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ink-muted)] mt-3 px-1 lg:max-w-[255px]">
                <span>Free 24–48h Dispatch in Lagos</span>
                <Link href="/shop" className="hover:underline">
                  Archive →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Shared Store Footer */}
      <StoreFooter />
    </div>
  );
}
