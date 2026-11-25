"use client";

import React from "react";
import Link from "next/link";
import { formatNaira } from "@/lib/currency";
import type { GarmentDTO, GarmentVariantDTO } from "@/lib/types";

interface InspectPanelProps {
  visible: boolean;
  garment: GarmentDTO;
  hangerSide: "FRONT" | "BACK";
  selectedVariant: GarmentVariantDTO;
  panelRef: React.RefObject<HTMLElement | null>;
  onSpinTo: (side: "FRONT" | "BACK") => void;
  onSelectVariant: (variant: GarmentVariantDTO) => void;
  onPutInBag: () => void;
}

export default function InspectPanel({
  visible,
  garment,
  hangerSide,
  selectedVariant,
  panelRef,
  onSpinTo,
  onSelectVariant,
  onPutInBag,
}: InspectPanelProps) {
  return (
    <aside
      ref={panelRef}
      className={
        (visible ? "flex" : "hidden") +
        " fixed top-24 bottom-8 md:right-[24vw] w-[min(390px,42vw)] z-30 flex-col justify-center max-md:top-[42vh] max-md:bottom-3 max-md:left-6 max-md:right-6 max-md:w-auto max-md:max-h-[55vh] max-md:overflow-y-auto max-md:z-40"
      }
    >
      <div className="bg-white/85 backdrop-blur-md border border-[#141413]/10 p-5 md:p-6 shadow-[0_24px_48px_rgba(0,0,0,0.06)] max-h-[calc(100vh-7.5rem)] max-md:max-h-full overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3.5 mb-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            Hanger View
          </span>
          <div className="inline-flex items-center gap-1 bg-[#F2F0EC] p-1 rounded-sm">
            <button
              onClick={() => onSpinTo("FRONT")}
              className={
                "px-3 py-1 text-[11px] uppercase tracking-[0.15em] font-medium transition " +
                (hangerSide === "FRONT"
                  ? "bg-[#141413] text-white"
                  : "text-[#141413]/70 hover:text-[#141413]")
              }
            >
              Front
            </button>
            <button
              onClick={() => onSpinTo("BACK")}
              className={
                "px-3 py-1 text-[11px] uppercase tracking-[0.15em] font-medium transition " +
                (hangerSide === "BACK"
                  ? "bg-[#141413] text-white"
                  : "text-[#141413]/70 hover:text-[#141413]")
              }
            >
              Back
            </button>
          </div>
        </div>

        <h2 className="font-editorial text-3xl md:text-4xl font-medium mt-1 leading-tight">
          {garment.title}
        </h2>
        <p className="font-mono text-base mt-1.5">
          {formatNaira(garment.priceKobo)}
        </p>
        <p className="text-xs leading-relaxed text-[#4E4C47] mt-2.5">
          {garment.description}
        </p>

        <div className="mt-4 border-t border-[var(--hairline)] text-xs">
          <div className="flex justify-between py-2 border-b border-[var(--hairline)]">
            <span className="text-[var(--ink-muted)] uppercase tracking-wider text-[10px]">
              Fabric
            </span>
            <span className="font-medium">{garment.fabric}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[var(--hairline)]">
            <span className="text-[var(--ink-muted)] uppercase tracking-wider text-[10px]">
              Weight
            </span>
            <span className="font-mono">{garment.weightGsm}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[var(--hairline)]">
            <span className="text-[var(--ink-muted)] uppercase tracking-wider text-[10px]">
              Fit
            </span>
            <span className="font-medium">{garment.fit}</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              Select Size
            </span>
            <span className="font-mono text-[10px] text-[#141413]">
              {selectedVariant.chestSpec} / {selectedVariant.lengthSpec}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {garment.variants.map((variant) => {
              const active = variant.id === selectedVariant.id;
              const soldOut = variant.stockQty < 1;
              return (
                <button
                  key={variant.id}
                  disabled={soldOut}
                  onClick={() => onSelectVariant(variant)}
                  className={
                    "min-h-11 py-2 border text-xs font-mono transition " +
                    (active
                      ? "border-[#141413] bg-[#141413] text-white"
                      : "border-[#141413]/20 hover:border-[#141413]") +
                    (soldOut ? " opacity-35 line-through cursor-not-allowed" : "")
                  }
                >
                  {variant.size}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={onPutInBag}
          disabled={selectedVariant.stockQty < 1}
          className="mt-5 w-full py-3.5 shop-primary text-xs uppercase tracking-[0.2em] font-medium disabled:opacity-40 transition flex items-center justify-center gap-2.5 shadow-md"
        >
          <span>Fold &amp; Put in Custom Bag</span>
          <span>↘</span>
        </button>

        <Link
          href={`/fitting-room?shirt=${encodeURIComponent(garment.slug)}`}
          className="mt-2.5 w-full py-2.5 border border-[#141413]/25 text-[#141413] text-xs uppercase tracking-[0.18em] font-medium hover:border-[#141413] hover:bg-[#141413]/5 transition flex items-center justify-center gap-2 rounded-xs text-center"
        >
          <span>Try on Model</span>
          <span className="font-mono text-xs">→</span>
        </Link>
      </div>
    </aside>
  );
}
