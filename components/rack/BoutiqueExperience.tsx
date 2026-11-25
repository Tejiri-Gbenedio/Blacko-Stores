"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { formatNaira } from "@/lib/currency";
import type { GarmentDTO, GarmentVariantDTO, PackedBagItemDTO } from "@/lib/types";
import InspectPanel from "./InspectPanel";
import { useBag } from "@/components/bag/BagContext";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const RAIL_ANGLE_DEG = -11;
const RAIL_SLOPE = Math.tan((RAIL_ANGLE_DEG * Math.PI) / 180);
const HOOK_ARCH_RATIO = 0.06875; // Inner arch curve contact point (row 66/960)
const SCROLL_DISTANCE_PER_SHIRT = 360; // 360px per shirt (1,080px total across 4 garments)

export default function BoutiqueExperience({ garments }: { garments: GarmentDTO[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<"BROWSE" | "INSPECT">("BROWSE");
  const [hangerSide, setHangerSide] = useState<"FRONT" | "BACK">("FRONT");
  const [selectedVariant, setSelectedVariant] = useState<GarmentVariantDTO>(
    garments[0].variants[1] || garments[0].variants[0]
  );

  const { addToBag, drawerOpen, setDrawerOpen } = useBag();

  const isAnimatingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;

  const railRef = useRef<HTMLDivElement | null>(null);
  const flangeRef = useRef<HTMLDivElement | null>(null);
  const hudRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);

  const activeGarment = garments[activeIndex] || garments[0];

  // Lock body scroll in INSPECT mode
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (mode === "INSPECT") {
      const root = document.documentElement;
      const prev = root.style.overflowY;
      root.style.overflowY = "hidden";
      return () => {
        root.style.overflowY = prev;
      };
    }
  }, [mode]);

  // Pre-decode all garment sprites so first spin never stutters
  useEffect(() => {
    garments.forEach((g) => {
      [g.frontImgUrl, g.sideImgUrl, g.backImgUrl, g.foldedImgUrl].forEach((src) => {
        const pre = new Image();
        pre.src = src;
        if (pre.decode) pre.decode().catch(() => {});
      });
    });
  }, [garments]);

  // Keep selected variant synced when switching active shirt
  useEffect(() => {
    const g = garments[activeIndex];
    if (g) {
      setSelectedVariant(g.variants[1] || g.variants[0]);
    }
  }, [activeIndex, garments]);

  const syncRailToHooks = useCallback(() => {
    const slot = slotRefs.current[0];
    const rail = railRef.current;
    const flange = flangeRef.current;
    if (!slot || !rail || !flange) return;

    // Contact point is row 66 of 960 (ratio 0.06875).
    // The steel rail has 11px thickness; its top edge must touch row 66.
    // Center line of rail is therefore at hookContactY + 5.5px.
    const hookX = slot.offsetLeft + slot.offsetWidth * 0.5;
    const hookContactY = slot.offsetTop + slot.offsetHeight * HOOK_ARCH_RATIO;
    const hookCenterRailY = hookContactY + 5.5;

    const railCenterX = rail.offsetLeft + rail.offsetWidth * 0.5;
    const railCenterY = hookCenterRailY + (railCenterX - hookX) * RAIL_SLOPE;
    rail.style.top = railCenterY - 5.5 + "px";

    const flangeX = window.innerWidth * 0.945;
    const flangeY = hookCenterRailY + (flangeX - hookX) * RAIL_SLOPE;
    flange.style.left = flangeX - 16 + "px";
    flange.style.top = flangeY - 16 + "px";
  }, []);

  // Continuous smooth scrub calculation across the -11 deg steel rail
  const renderRackAt = useCallback(
    (floatIndex: number) => {
      const stepX = Math.max(46, Math.min(72, window.innerWidth * 0.046));
      const stepY = stepX * RAIL_SLOPE;

      slotRefs.current.forEach((slot, i) => {
        if (!slot) return;
        const offset = i - floatIndex;

        if (offset < 0) {
          // Gliding smoothly off-screen to the left along the rail angle
          const x = offset * 420;
          const y = x * RAIL_SLOPE;
          const scale = 1.0 + Math.abs(offset) * 0.04;
          const opacity = Math.max(0, 1 + offset * 1.5);
          gsap.set(slot, {
            x,
            y,
            scale,
            opacity,
            zIndex: Math.max(1, Math.round(15 + offset * 5)),
            pointerEvents: "none",
            transformOrigin: "50% 6.9%",
          });
          slot.classList.remove("is-foreground");
        } else {
          // Sliding forward smoothly along the -11° steel rail
          const x = offset * stepX;
          const y = offset * stepY;
          const scale = Math.max(0.74, 1 - offset * 0.065);
          const opacity = offset > 4 ? 0 : 1;
          const zIndex = Math.round(35 - offset * 2);
          gsap.set(slot, {
            x,
            y,
            scale,
            opacity,
            zIndex,
            pointerEvents: offset > 4 ? "none" : "auto",
            cursor: "pointer",
            transformOrigin: "50% 6.9%",
          });
          slot.classList.toggle("is-foreground", Math.abs(offset) < 0.35);
        }
      });

      const roundedIdx = Math.min(
        garments.length - 1,
        Math.max(0, Math.round(floatIndex))
      );
      if (roundedIdx !== activeIndexRef.current) {
        activeIndexRef.current = roundedIdx;
        setActiveIndex(roundedIdx);
      }
    },
    [garments.length]
  );

  const layoutRack = useCallback(
    (targetIdx: number, immediate = false) => {
      if (immediate) {
        renderRackAt(targetIdx);
        return;
      }
      const currentFloat = activeIndexRef.current;
      gsap.to(
        { val: currentFloat },
        {
          val: targetIdx,
          duration: 0.35,
          ease: "power2.out",
          onUpdate: function () {
            renderRackAt(this.targets()[0].val);
          },
          onComplete: () => {
            renderRackAt(targetIdx);
            const slot = slotRefs.current[targetIdx];
            if (slot) {
              gsap.fromTo(
                slot,
                { rotation: -1.2, transformOrigin: "50% 6.9%" },
                {
                  rotation: 0,
                  duration: 0.55,
                  ease: "elastic.out(1, 0.42)",
                  transformOrigin: "50% 6.9%",
                  overwrite: false,
                }
              );
            }
          },
        }
      );
    },
    [renderRackAt]
  );

  // Initial mount layout (run once)
  useEffect(() => {
    layoutRack(0, true);
    syncRailToHooks();
  }, [layoutRack, syncRailToHooks]);

  // Window resize handler
  useEffect(() => {
    const onResize = () => {
      syncRailToHooks();
      ScrollTrigger.refresh();
      if (mode === "INSPECT") {
        const slot = slotRefs.current[activeIndexRef.current];
        if (slot) {
          gsap.set(slot, { x: window.innerWidth < 768 ? 0 : -window.innerWidth * 0.14 });
        }
      } else {
        renderRackAt(activeIndexRef.current);
      }
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [mode, renderRackAt, syncRailToHooks]);

  // Attach ResizeObserver to lead slot so rail always recalculates as soon as sprite layout finishes
  useEffect(() => {
    const slot = slotRefs.current[0];
    if (!slot || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      syncRailToHooks();
    });
    observer.observe(slot);

    return () => {
      observer.disconnect();
    };
  }, [syncRailToHooks]);

  // GSAP ScrollTrigger with responsive continuous scrub and gentle snap
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || garments.length <= 1) return;

    const maxScroll = (garments.length - 1) * SCROLL_DISTANCE_PER_SHIRT;
    const st = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: `+=${maxScroll}`,
      scrub: 0.35,
      snap: {
        snapTo: 1 / (garments.length - 1),
        duration: { min: 0.22, max: 0.38 },
        delay: 0.14,
        ease: "power2.out",
      },
      onUpdate: (self) => {
        if (mode !== "BROWSE" || isAnimatingRef.current) return;
        renderRackAt(self.progress * (garments.length - 1));
      },
    });

    return () => {
      st.kill();
    };
  }, [garments.length, mode, renderRackAt]);

  const goToShirt = useCallback(
    (nextIndex: number) => {
      if (mode !== "BROWSE" || isAnimatingRef.current) return;
      const clamped = Math.max(0, Math.min(garments.length - 1, nextIndex));
      if (clamped === activeIndexRef.current) return;

      const maxScroll = (garments.length - 1) * SCROLL_DISTANCE_PER_SHIRT;
      const targetY = (clamped / (garments.length - 1)) * maxScroll;
      window.scrollTo({
        top: targetY,
        behavior: "smooth",
      });
    },
    [garments.length, mode]
  );

  const enterInspectMode = useCallback(
    (targetIndex?: number) => {
      if (mode === "INSPECT" || isAnimatingRef.current) return;
      isAnimatingRef.current = true;

      const targetIdx =
        typeof targetIndex === "number" ? targetIndex : activeIndexRef.current;
      const targetGarment = garments[targetIdx] || garments[0];

      if (targetIdx !== activeIndexRef.current) {
        activeIndexRef.current = targetIdx;
        setActiveIndex(targetIdx);
        // Align scroll position so when exiting, the rail stays on this shirt
        const targetY = targetIdx * SCROLL_DISTANCE_PER_SHIRT;
        window.scrollTo({ top: targetY, behavior: "instant" });
        renderRackAt(targetIdx);
      }

      setMode("INSPECT");
      setHangerSide("FRONT");

      const activeSlot = slotRefs.current[targetIdx];
      const activeImg = imgRefs.current[targetIdx];
      if (activeImg) activeImg.src = targetGarment.frontImgUrl;

      const tl = gsap.timeline({
        onComplete: () => {
          isAnimatingRef.current = false;
        },
      });

      slotRefs.current.forEach((slot, i) => {
        if (slot && i !== targetIdx) {
          tl.to(slot, { opacity: 0, x: "+=70", duration: 0.36, ease: "power2.in" }, 0);
          gsap.set(slot, { pointerEvents: "none" });
        }
      });

      tl.to(
        [railRef.current, flangeRef.current, hudRef.current],
        {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out",
        },
        0
      );

      if (activeSlot) {
        gsap.set(activeSlot, { opacity: 1, zIndex: 40, pointerEvents: "auto" });
        tl.to(
          activeSlot,
          {
            x: window.innerWidth < 768 ? 0 : -window.innerWidth * 0.14,
            y: window.innerWidth < 768 ? -35 : 0,
            scale: window.innerWidth < 768 ? 0.62 : Math.min(1.07, window.innerHeight / 680),
            duration: 0.62,
            ease: "power3.inOut",
          },
          0.04
        );
      }

      if (panelRef.current) {
        tl.fromTo(
          panelRef.current,
          { opacity: 0, x: 34 },
          { opacity: 1, x: 0, duration: 0.44, ease: "power3.out" },
          0.22
        );
      }
    },
    [garments, mode, renderRackAt]
  );

  const exitInspectMode = useCallback(
    (force: boolean | unknown = false) => {
      const shouldForce = force === true;
      if (mode === "BROWSE" || (!shouldForce && isAnimatingRef.current)) return;
      isAnimatingRef.current = true;

      const currIdx = activeIndexRef.current;
      const currGarment = garments[currIdx] || garments[0];
      const activeImg = imgRefs.current[currIdx];
      if (activeImg) {
        gsap.set(activeImg, { scaleX: 1, opacity: 1 });
        activeImg.src = currGarment.frontImgUrl;
      }

      const tl = gsap.timeline({
        onComplete: () => {
          setMode("BROWSE");
          setHangerSide("FRONT");
          isAnimatingRef.current = false;
          requestAnimationFrame(() => {
            const targetY = currIdx * SCROLL_DISTANCE_PER_SHIRT;
            window.scrollTo({ top: targetY, behavior: "instant" });
            ScrollTrigger.refresh();
            layoutRack(currIdx, false);
            syncRailToHooks();
          });
        },
      });

      if (panelRef.current) {
        tl.to(panelRef.current, { opacity: 0, x: 24, duration: 0.22, ease: "power2.in" }, 0);
      }
      tl.to(
        [railRef.current, flangeRef.current, hudRef.current],
        {
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
        },
        0.08
      );
    },
    [garments, layoutRack, mode, syncRailToHooks]
  );

  const spinHangerTo = useCallback(
    (targetSide: "FRONT" | "BACK") => {
      if (hangerSide === targetSide) return;
      setHangerSide(targetSide);

      const currIdx = activeIndexRef.current;
      const garment = garments[currIdx] || garments[0];
      const slot = slotRefs.current[currIdx];
      const img = imgRefs.current[currIdx];
      if (!slot || !img) return;

      gsap.killTweensOf([img, slot]);
      isAnimatingRef.current = true;

      gsap
        .timeline({
          onComplete: () => {
            isAnimatingRef.current = false;
          },
        })
        .to(img, {
          scaleX: 0.2,
          duration: 0.14,
          ease: "power2.in",
          onComplete: () => {
            img.src = garment.sideImgUrl;
          },
        })
        .fromTo(
          img,
          { scaleX: 0.8 },
          {
            scaleX: 0.4,
            duration: 0.08,
            ease: "none",
            onComplete: () => {
              img.src =
                targetSide === "BACK"
                  ? garment.backImgUrl
                  : garment.frontImgUrl;
            },
          }
        )
        .fromTo(img, { scaleX: 0.2 }, { scaleX: 1, duration: 0.18, ease: "power2.out" })
        .fromTo(
          slot,
          { rotation: targetSide === "BACK" ? 1.6 : -1.6 },
          { rotation: 0, duration: 0.45, ease: "elastic.out(1, 0.4)" },
          "-=0.15"
        );
    },
    [garments, hangerSide]
  );

  const putCurrentShirtInBag = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const slot = slotRefs.current[activeIndex];
    const img = imgRefs.current[activeIndex];
    if (!slot || !img) {
      isAnimatingRef.current = false;
      return;
    }

    // 1. Shrink/fade the active slot on the rack immediately
    gsap.to(slot, { scale: 0.88, opacity: 0, duration: 0.15, ease: "power2.in" });

    // 2. Snap layout back to BROWSE mode early at +=0.1s
    setTimeout(() => {
      exitInspectMode(true);
    }, 100);

    // 3. Delegate flying animation and persistence to BagContext
    addToBag(selectedVariant.id, activeGarment, selectedVariant, slot);
  }, [activeGarment, activeIndex, addToBag, exitInspectMode, selectedVariant]);

  // Keyboard Controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (drawerOpen) {
          setDrawerOpen(false);
        } else if (mode === "INSPECT") {
          exitInspectMode();
        }
        return;
      }
      if (drawerOpen) return;
      if (e.key === "ArrowRight") goToShirt(activeIndex + 1);
      if (e.key === "ArrowLeft") goToShirt(activeIndex - 1);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, drawerOpen, exitInspectMode, goToShirt, mode]);

  return (
    <section
      ref={containerRef}
      id="hero-rail"
      style={{
        height: `calc(100vh + ${(garments.length - 1) * SCROLL_DISTANCE_PER_SHIRT}px)`,
      }}
      className="relative w-full"
    >
      <div
        className={`h-screen w-full overflow-hidden ${mode === "INSPECT" ? "fixed inset-x-0 top-0 z-30" : "sticky top-0"}`}
        onPointerDown={(e) => {
          dragStartXRef.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (mode !== "BROWSE" || isAnimatingRef.current) return;
          const dx = e.clientX - dragStartXRef.current;
          if (Math.abs(dx) > 45) goToShirt(activeIndex + (dx < 0 ? 1 : -1));
        }}
      >
        {/* Contextual Back Button in Inspect Mode */}
        {mode === "INSPECT" && (
          <button
            onClick={() => exitInspectMode()}
            className="fixed top-20 left-6 md:left-10 z-40 flex items-center gap-2 px-4 py-2 bg-[#141413] text-[#F9F8F6] text-xs uppercase tracking-[0.18em] font-medium hover:bg-[#2B2B28] transition shadow-md rounded-sm"
          >
            <span>←</span>
            <span>Back to Rack</span>
          </button>
        )}

        {/* -11 deg Brushed Steel Rail & Flange */}
        <div ref={flangeRef} className="rail-flange" />
        <div ref={railRef} className="steel-rail" />

        {/* Diagonal Rack Stage */}
        <div className="relative w-full h-full">
          {garments.map((shirt, idx) => (
            <div
              key={shirt.id}
              ref={(el) => {
                slotRefs.current[idx] = el;
              }}
              className="hanger-slot"
              onClick={() => {
                if (mode === "BROWSE") {
                  enterInspectMode(idx);
                }
              }}
              onMouseEnter={() => {
                if (mode === "BROWSE" && !isAnimatingRef.current) {
                  const slot = slotRefs.current[idx];
                  if (slot) {
                    gsap.fromTo(
                      slot,
                      { rotation: 1.1 },
                      { rotation: 0, duration: 0.75, ease: "elastic.out(1, 0.35)" }
                    );
                  }
                }
              }}
            >
              {mode === "BROWSE" && <div className="hook-contact-shadow" />}
              <img
                ref={(el) => {
                  imgRefs.current[idx] = el;
                }}
                src={shirt.frontImgUrl}
                alt={shirt.title}
                className="shirt-sprite"
                loading={idx === 0 ? "eager" : "lazy"}
                decoding={idx === 0 ? "sync" : "async"}
                // @ts-ignore
                fetchPriority={idx === 0 ? "high" : "low"}
                onLoad={idx === 0 ? syncRailToHooks : undefined}
              />
            </div>
          ))}
        </div>

        {/* Browse Mode HUD */}
        <div
          id="browse-hud"
          ref={hudRef}
          className={
            (mode === "INSPECT" ? "pointer-events-none " : "") +
            "fixed bottom-12 md:bottom-14 left-6 md:left-8 z-40 flex flex-col gap-3.5 max-w-md pr-4"
          }
        >
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ink-muted)] mb-1.5">
              <span>
                {String(activeIndex + 1).padStart(2, "0")} /{" "}
                {String(garments.length).padStart(2, "0")}
              </span>
            </div>
            <h1 className="font-editorial text-3xl md:text-5xl font-medium tracking-tight leading-none text-[#141413]">
              {activeGarment.title}
            </h1>
            <p className="font-mono text-sm text-[#141413]/80 mt-2">
              {formatNaira(activeGarment.priceKobo)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => enterInspectMode(activeIndex)}
              className="px-5 md:px-6 py-3 shop-primary text-xs uppercase tracking-[0.18em] font-medium transition shadow-sm"
            >
              Take off the rack
            </button>

            {garments.length > 1 && (
              <div
                className={
                  "flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)] transition-opacity duration-300 pl-2 " +
                  (activeIndex === garments.length - 1
                    ? "opacity-0 pointer-events-none"
                    : "opacity-100")
                }
              >
                <span>Scroll to browse</span>
                <span className="text-xs">↓</span>
              </div>
            )}
          </div>
        </div>

        {/* Solo In-Place Inspection Panel */}
        <InspectPanel
          visible={mode === "INSPECT"}
          garment={activeGarment}
          hangerSide={hangerSide}
          selectedVariant={selectedVariant}
          panelRef={panelRef}
          onSpinTo={spinHangerTo}
          onSelectVariant={setSelectedVariant}
          onPutInBag={putCurrentShirtInBag}
        />
      </div>
    </section>
  );
}
