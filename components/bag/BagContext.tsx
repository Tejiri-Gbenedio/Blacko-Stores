"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import type { GarmentDTO, GarmentVariantDTO, PackedBagItemDTO } from "@/lib/types";

export interface BagContextValue {
  bagItems: PackedBagItemDTO[];
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  addToBag: (
    variantId: string,
    garment: GarmentDTO,
    variant: GarmentVariantDTO,
    sourceEl?: HTMLElement | null
  ) => Promise<void>;
  removeFromBag: (id: string) => Promise<void>;
  bagDockRef: React.RefObject<HTMLDivElement | null>;
  mobileBagBtnRef: React.RefObject<HTMLButtonElement | null>;
  flyToBag: (
    sourceEl: HTMLElement,
    foldedImgUrl: string,
    onLand?: () => void
  ) => void;
  toastMessage: string | null;
  clearToast: () => void;
}

const BagContext = createContext<BagContextValue | null>(null);

export function BagProvider({ children }: { children: React.ReactNode }) {
  const [bagItems, setBagItems] = useState<PackedBagItemDTO[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const bagDockRef = useRef<HTMLDivElement | null>(null);
  const mobileBagBtnRef = useRef<HTMLButtonElement | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearToast = useCallback(() => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(null);
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  // Hydrate bag from Neon session API on mount
  useEffect(() => {
    fetch("/api/bag")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.items)) {
          setBagItems(data.items);
        }
      })
      .catch(() => {});
  }, []);

  // Lock body scroll when BagDrawer is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (drawerOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [drawerOpen]);

  const flyToBag = useCallback(
    (sourceEl: HTMLElement, foldedImgUrl: string, onLand?: () => void) => {
      const bagDock = bagDockRef.current;
      const mobileBagBtn = mobileBagBtnRef.current;
      const isMobile =
        typeof window !== "undefined" &&
        (window.innerWidth < 768 ||
          !bagDock ||
          window.getComputedStyle(bagDock).display === "none");

      const targetEl = isMobile && mobileBagBtn ? mobileBagBtn : bagDock;
      if (!sourceEl || !targetEl) {
        onLand?.();
        return;
      }

      const sourceRect = sourceEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      const startW = Math.min(220, Math.max(120, sourceRect.width * 0.62));
      const startX = sourceRect.left + (sourceRect.width - startW) / 2;
      const startY = sourceRect.top + Math.max(10, (sourceRect.height - startW) * 0.35);

      const targetW = isMobile ? 32 : targetRect.width * 0.46;
      const targetScale = targetW / startW;

      const destX = isMobile
        ? targetRect.left + targetRect.width / 2 - (startW * targetScale) / 2
        : targetRect.left + targetRect.width * 0.27;

      const destY = isMobile
        ? targetRect.top + targetRect.height / 2 - (startW * targetScale) / 2
        : targetRect.top + targetRect.height * 0.34;

      const flyer = document.createElement("img");
      flyer.src = foldedImgUrl;
      flyer.className = "flying-folded";
      flyer.style.width = startW + "px";
      flyer.style.zIndex = "9999";
      document.body.appendChild(flyer);

      gsap.set(flyer, {
        x: startX,
        y: startY,
        transformOrigin: "top left",
        opacity: 0,
        scale: 0.76,
      });

      const tl = gsap.timeline();

      tl.to(
        flyer,
        {
          scale: 1.05,
          opacity: 1,
          rotation: -3,
          duration: 0.15,
          ease: "back.out(1.4)",
        },
        0
      )
        .to(
          flyer,
          {
            x: destX,
            y: destY,
            scale: targetScale,
            rotation: isMobile ? 4 : -4,
            duration: 0.32,
            ease: "power3.inOut",
          },
          0.12
        )
        .to(
          flyer,
          {
            y: isMobile ? destY : "+=26",
            opacity: 0.85,
            duration: 0.12,
            ease: "power2.in",
            onComplete: () => {
              flyer.remove();
              onLand?.();

              if (isMobile && mobileBagBtn) {
                // Elastic bounce on the header BAG pill
                gsap.fromTo(
                  mobileBagBtn,
                  { scale: 1.25 },
                  { scale: 1, duration: 0.52, ease: "elastic.out(1.2, 0.35)" }
                );
              } else if (bagDock) {
                // Elastic squash-and-stretch on the physical bag dock
                gsap.fromTo(
                  bagDock,
                  { scaleY: 0.91, scaleX: 1.05, y: 4 },
                  {
                    scaleY: 1,
                    scaleX: 1,
                    y: 0,
                    duration: 0.56,
                    ease: "elastic.out(1, 0.35)",
                  }
                );
              }
            },
          },
          0.42
        );
    },
    []
  );

  const addToBag = useCallback(
    async (
      variantId: string,
      garment: GarmentDTO,
      variant: GarmentVariantDTO,
      sourceEl?: HTMLElement | null
    ) => {
      const tempId =
        "temp-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
      const optimisticItem: PackedBagItemDTO = {
        id: tempId,
        variantId: variant.id,
        garmentId: garment.id,
        title: garment.title,
        size: variant.size,
        priceKobo: garment.priceKobo,
        quantity: 1,
        foldedImgUrl: garment.foldedImgUrl,
      };

      if (sourceEl) {
        flyToBag(sourceEl, garment.foldedImgUrl, () => {
          setBagItems((prev) => [...prev, optimisticItem]);
        });
      } else {
        setBagItems((prev) => [...prev, optimisticItem]);
      }

      try {
        const res = await fetch("/api/bag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast(data.error || `Failed to add item (HTTP ${res.status})`);
          // Revert optimistic item
          setBagItems((prev) => prev.filter((i) => i.id !== tempId));
          return;
        }

        if (Array.isArray(data.items)) {
          setBagItems(data.items);
        }
      } catch (err) {
        console.error("addToBag network error:", err);
        showToast("Network error persisting to bag");
        setBagItems((prev) => prev.filter((i) => i.id !== tempId));
      }
    },
    [flyToBag, showToast]
  );

  const removeFromBag = useCallback(
    async (id: string) => {
      setBagItems((prev) => prev.filter((item) => item.id !== id));
      if (!id.startsWith("temp-")) {
        try {
          await fetch(`/api/bag/${id}`, { method: "DELETE" });
        } catch (err) {
          console.error("removeFromBag network error:", err);
        }
      }
    },
    []
  );

  return (
    <BagContext.Provider
      value={{
        bagItems,
        drawerOpen,
        setDrawerOpen,
        addToBag,
        removeFromBag,
        bagDockRef,
        mobileBagBtnRef,
        flyToBag,
        toastMessage,
        clearToast,
      }}
    >
      {children}
    </BagContext.Provider>
  );
}

export function useBag() {
  const ctx = useContext(BagContext);
  if (!ctx) {
    throw new Error("useBag must be used within a BagProvider");
  }
  return ctx;
}
