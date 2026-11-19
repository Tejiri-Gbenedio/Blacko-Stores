"use client";

import React, { useState, useEffect } from "react";
import type { PackedBagItemDTO } from "@/lib/types";

interface CustomBagDockProps {
  items: PackedBagItemDTO[];
  dockRef: React.RefObject<HTMLDivElement | null>;
  onOpenDrawer: () => void;
}

export default function CustomBagDock({
  items,
  dockRef,
  onOpenDrawer,
}: CustomBagDockProps) {
  const visibleStack = items.slice(-4);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 350);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={dockRef}
      onClick={onOpenDrawer}
      className={`bag-dock hidden md:block ${isScrolled ? "is-scrolled" : ""}`}
      title="Open your Blacko Stores Weekender Bag"
    >
      <div className="bag-dock-badge absolute -top-6 right-3 bg-[#141413] text-[#F9F8F6] px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.15em] shadow whitespace-nowrap">
        Blacko Bag • {items.length} packed
      </div>

      {/* Layer 1: Rear Interior & Handle */}
      <img
        src="/assets/bag/bag-back.webp"
        alt="Blacko Stores Custom Weekender Bag"
        className="bag-layer-back"
      />

      {/* Layer 2: Packed Folded Shirts Inside Bag Mouth */}
      <div className="bag-packed-stack">
        {visibleStack.map((item, idx) => (
          <img
            key={item.id}
            src={item.foldedImgUrl}
            alt={item.title}
            className="packed-shirt-item"
            style={{
              bottom: idx * 7 + "px",
              transform: "rotate(" + (idx % 2 === 0 ? -4 : 3) + "deg) scale(" + (0.96 - idx * 0.02) + ")",
              zIndex: 20 + idx,
            }}
          />
        ))}
      </div>

      {/* Layer 3: Front Canvas Wall & Leather Rim Cutout */}
      <img
        src="/assets/bag/bag-front-lip.webp"
        alt=""
        aria-hidden="true"
        className="bag-layer-front"
      />
    </div>
  );
}
