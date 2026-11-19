"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { formatNaira } from "@/lib/currency";
import type { GarmentDTO, GarmentVariantDTO } from "@/lib/types";
import { useBag } from "@/components/bag/BagContext";

interface QuickInspectModalProps {
  garment: GarmentDTO | null;
  onClose: () => void;
}

export default function QuickInspectModal({
  garment,
  onClose,
}: QuickInspectModalProps) {
  const { addToBag } = useBag();
  const [hangerSide, setHangerSide] = useState<"FRONT" | "BACK">("FRONT");
  const [selectedVariant, setSelectedVariant] = useState<GarmentVariantDTO | null>(null);

  const slotRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isSpinningRef = useRef(false);

  // Sync selected variant when garment changes
  useEffect(() => {
    if (garment) {
      setSelectedVariant(garment.variants.find((v) => v.stockQty > 0) || garment.variants[0]);
      setHangerSide("FRONT");
    }
  }, [garment]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!garment || !selectedVariant) return null;

  function spinHangerTo(targetSide: "FRONT" | "BACK") {
    if (!garment || hangerSide === targetSide || isSpinningRef.current) return;
    isSpinningRef.current = true;
    setHangerSide(targetSide);

    const img = imgRef.current;
    const slot = slotRef.current;
    if (!img || !slot) {
      isSpinningRef.current = false;
      return;
    }

    gsap.killTweensOf([img, slot]);

    gsap
      .timeline({
        onComplete: () => {
          isSpinningRef.current = false;
        },
      })
      .to(img, {
        scaleX: 0.32,
        duration: 0.15,
        ease: "power2.in",
        onComplete: () => {
          img.src = garment.sideImgUrl;
        },
      })
      .fromTo(
        img,
        { scaleX: 0.84 },
        {
          scaleX: 0.56,
          duration: 0.1,
          ease: "none",
          onComplete: () => {
            img.src =
              targetSide === "BACK"
                ? garment.backImgUrl
                : garment.frontImgUrl;
          },
        }
      )
      .fromTo(img, { scaleX: 0.32 }, { scaleX: 1, duration: 0.25, ease: "power2.out" })
      .fromTo(
        slot,
        { rotation: targetSide === "BACK" ? 1.8 : -1.8, transformOrigin: "50% 6.9%" },
        { rotation: 0, duration: 0.68, ease: "elastic.out(1, 0.36)", transformOrigin: "50% 6.9%" },
        "-=0.2"
      );
  }

  async function handlePutInBag() {
    if (!garment || !selectedVariant) return;
    const sourceEl = slotRef.current;
    await addToBag(selectedVariant.id, garment, selectedVariant, sourceEl);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 animate-in fade-in duration-200">
      {/* Blurred Dim Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-md cursor-pointer"
        aria-label="Close modal backdrop"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-4xl bg-[#F9F8F6] border border-[#141413]/15 shadow-2xl rounded-sm overflow-hidden flex flex-col md:flex-row max-h-[92vh]">
        {/* Close Button Top-Right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/80 border border-[#141413]/15 hover:border-[#141413] flex items-center justify-center text-xs font-mono transition"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Left: The Hanging Shirt with 3-Frame Spin Controls */}
        <div className="w-full md:w-1/2 bg-[#F2F0EC]/80 p-8 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-[var(--hairline)] relative min-h-[380px] md:min-h-[520px]">
          {/* Top Hanger View Toggle */}
          <div className="w-full flex items-center justify-between z-10">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              Interactive Hanger
            </span>
            <div className="inline-flex items-center gap-1 bg-white/80 border border-[#141413]/10 p-1 rounded-sm shadow-sm">
              <button
                onClick={() => spinHangerTo("FRONT")}
                className={
                  "px-3 py-1 text-[11px] uppercase tracking-[0.16em] font-medium transition rounded-xs " +
                  (hangerSide === "FRONT"
                    ? "bg-[#141413] text-[#F9F8F6]"
                    : "text-[#141413]/70 hover:text-[#141413]")
                }
              >
                Front
              </button>
              <button
                onClick={() => spinHangerTo("BACK")}
                className={
                  "px-3 py-1 text-[11px] uppercase tracking-[0.16em] font-medium transition rounded-xs " +
                  (hangerSide === "BACK"
                    ? "bg-[#141413] text-[#F9F8F6]"
                    : "text-[#141413]/70 hover:text-[#141413]")
                }
              >
                Back
              </button>
            </div>
          </div>

          {/* Hanging Shirt Sprite */}
          <div
            ref={slotRef}
            className="my-auto relative max-w-[280px] sm:max-w-[320px] w-full aspect-[800/960] flex items-center justify-center cursor-pointer select-none"
            onClick={() => spinHangerTo(hangerSide === "FRONT" ? "BACK" : "FRONT")}
            title="Click to spin hanger"
          >
            <img
              ref={imgRef}
              src={hangerSide === "FRONT" ? garment.frontImgUrl : garment.backImgUrl}
              alt={garment.title}
              className="w-full h-full object-contain filter drop-shadow-[0_20px_24px_rgba(20,20,19,0.14)]"
            />
          </div>

          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] text-center">
            Click front/back to spin garment
          </p>
        </div>

        {/* Right: Garment Specs, Size Selector & Bag CTA */}
        <div className="w-full md:w-1/2 p-7 md:p-9 flex flex-col justify-between overflow-y-auto">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              {garment.lotLabel}
            </p>
            <h3 className="font-editorial text-3xl md:text-4xl font-medium tracking-tight mt-1 text-[#141413]">
              {garment.title}
            </h3>
            <p className="font-mono text-base md:text-lg text-[#141413]/90 mt-2">
              {formatNaira(garment.priceKobo)}
            </p>

            <p className="text-xs text-[#4E4C47] leading-relaxed mt-4">
              {garment.description}
            </p>

            {/* Editorial Spec Table */}
            <div className="mt-6 border-t border-[var(--hairline)] text-xs">
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

            {/* Size Selector with Chest & Length Hints */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Select Size
                </span>
                <span className="font-mono text-[11px] text-[#141413]">
                  {selectedVariant.chestSpec} • {selectedVariant.lengthSpec}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {garment.variants.map((v) => {
                  const isSelected = v.id === selectedVariant.id;
                  const isOos = v.stockQty < 1;
                  return (
                    <button
                      key={v.id}
                      disabled={isOos}
                      onClick={() => setSelectedVariant(v)}
                      className={
                        "py-2.5 border text-xs font-mono uppercase transition rounded-sm " +
                        (isSelected
                          ? "border-[#141413] bg-[#141413] text-white shadow-sm"
                          : "border-[#141413]/20 bg-white hover:border-[#141413]") +
                        (isOos ? " opacity-35 line-through cursor-not-allowed bg-transparent" : "")
                      }
                    >
                      {v.size}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CTA: Fold & Put in Custom Bag */}
          <div className="pt-6 mt-6 border-t border-[var(--hairline)]">
            <button
              onClick={handlePutInBag}
              disabled={selectedVariant.stockQty < 1}
              className="w-full py-3.5 bg-[#141413] text-[#F9F8F6] text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#2B2B28] disabled:opacity-40 transition flex items-center justify-center gap-3 shadow-md rounded-sm active:scale-[0.99]"
            >
              <span>Fold &amp; Put in Custom Bag</span>
              <span className="font-mono text-sm">↘</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
