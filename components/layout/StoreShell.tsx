"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBag } from "@/components/bag/BagContext";
import CustomBagDock from "@/components/bag/CustomBagDock";
import BagDrawer from "@/components/bag/BagDrawer";

export default function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    bagItems,
    drawerOpen,
    setDrawerOpen,
    removeFromBag,
    bagDockRef,
    mobileBagBtnRef,
    toastMessage,
  } = useBag();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
    setDrawerOpen(false);
  }, [pathname, setDrawerOpen]);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    { label: "Try On", href: "/fitting-room" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <div className="min-h-screen w-full relative flex flex-col">
      {/* Sticky Global Navigation Bar */}
      <header className="sticky top-0 left-0 right-0 z-[90] grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-6 md:px-10 h-16 xl:h-18 xl:flex xl:justify-between bg-[#F9F8F6]/85 backdrop-blur-md border-b border-[var(--hairline)] transition-colors">
        {/* Left: Nav Links */}
        <nav className="hidden xl:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                className={
                  "text-[11px] uppercase tracking-[0.22em] font-medium transition py-1 relative " +
                  (isActive
                    ? "text-[#141413]"
                    : "text-[var(--ink-muted)] hover:text-[#141413]")
                }
              >
                <span>{link.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#141413]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="xl:hidden flex items-center">
          <button
            onClick={() => {
              const nextState = !mobileMenuOpen;
              setMobileMenuOpen(nextState);
              if (nextState) setDrawerOpen(false);
            }}
            className="min-h-11 px-1.5 text-[11px] uppercase tracking-wider font-mono text-[#141413]"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? "✕ Close" : "☰ Menu"}
          </button>
        </div>

        {/* Center: Brand Wordmark */}
        <div className="flex items-center xl:absolute xl:left-1/2 xl:-translate-x-1/2">
          <Link
            href="/"
            className="whitespace-nowrap text-[11px] sm:text-sm lg:text-base font-semibold tracking-[0.17em] sm:tracking-[0.28em] uppercase text-[#141413] hover:opacity-75 transition select-none"
          >
            BLACKO STORES
          </Link>
        </div>

        {/* Right: Custom Bag Pill */}
        <div className="flex items-center justify-self-end">
          <button
            ref={mobileBagBtnRef}
            onClick={() => {
              setDrawerOpen(!drawerOpen);
              setMobileMenuOpen(false);
            }}
            className="flex min-h-11 items-center gap-1.5 px-2 sm:gap-2.5 sm:px-3.5 rounded-full border border-[#141413]/25 hover:border-[#141413] hover:bg-[#141413]/5 transition text-xs tracking-[0.14em] uppercase font-medium"
          >
            <span className="hidden sm:inline">Custom Bag</span>
            <span className="sm:hidden">Bag</span>
            <span className="font-mono bg-[#141413] text-[#F9F8F6] px-2 py-0.5 rounded-full text-[11px] min-w-[20px] text-center font-normal">
              {bagItems.length}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Backdrop & Drawer Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            id="mobile-menu-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            className="xl:hidden fixed inset-0 top-[64px] z-[95] bg-black/25 backdrop-blur-[2px]"
            aria-hidden="true"
          />
          <div
            id="mobile-menu-overlay"
            className="xl:hidden fixed inset-x-0 top-[64px] z-[100] bg-[#F9F8F6] border-b border-[var(--hairline)] px-6 py-6 flex flex-col gap-4 shadow-xl"
          >
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => {
                  setTimeout(() => setMobileMenuOpen(false), 10);
                }}
                className="text-xs uppercase tracking-[0.22em] font-medium text-[#141413] py-2 border-b border-[var(--hairline)] hover:opacity-70 transition block"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Main Page Flow */}
      <div className="flex-1 w-full relative z-40 overflow-x-clip">{children}</div>

      {/* Global Persistent Physical Weekender Bag Dock */}
      {!pathname?.startsWith("/admin") && (
        <CustomBagDock
          items={bagItems}
          dockRef={bagDockRef}
          onOpenDrawer={() => setDrawerOpen(true)}
        />
      )}

      {/* Global Slide-Over Naira Receipt & Paystack Drawer */}
      <BagDrawer
        open={drawerOpen}
        items={bagItems}
        onClose={() => setDrawerOpen(false)}
        onRemoveItem={removeFromBag}
      />

      {/* Global Persistence Error Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#141413] text-[#F9F8F6] px-4 py-2.5 shadow-2xl border border-red-500/40 rounded flex items-center gap-2.5 text-xs font-mono uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
