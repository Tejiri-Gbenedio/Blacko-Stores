"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatNaira } from "@/lib/currency";
import type { GarmentDTO } from "@/lib/types";

interface OrderItem {
  id: string;
  paystackReference: string;
  customerEmail: string;
  deliveryAddress: string | null;
  totalKobo: number;
  status: "PENDING" | "PAID" | "IN_ATELIER" | "DISPATCHED" | "DELIVERED";
  createdAt: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

interface DropSubscriber {
  id: string;
  email: string;
  createdAt: string;
}

interface AdminDashboardProps {
  initialAuthenticated?: boolean;
}

export default function AdminDashboard({ initialAuthenticated = false }: AdminDashboardProps) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [passcode, setPasscode] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"orders" | "inventory" | "messages" | "drop_list">("orders");

  // Data States
  const [loadingData, setLoadingData] = useState(false);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [garments, setGarments] = useState<GarmentDTO[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [subscribers, setSubscribers] = useState<DropSubscriber[]>([]);

  // Action Feedback States
  const [statusUpdating, setStatusUpdating] = useState<Record<string, boolean>>({});
  const [statusSuccess, setStatusSuccess] = useState<Record<string, string>>({});
  const [inventorySaving, setInventorySaving] = useState<Record<string, boolean>>({});
  const [inventorySuccess, setInventorySuccess] = useState<Record<string, string>>({});
  const [copiedEmails, setCopiedEmails] = useState(false);

  // Check auth on mount if not already confirmed
  useEffect(() => {
    if (!authenticated) {
      fetch("/api/admin/check")
        .then((r) => r.json())
        .then((data) => {
          if (data.authenticated) {
            setAuthenticated(true);
          }
        })
        .catch(() => {});
    }
  }, [authenticated]);

  const loadAllData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [ordersRes, invRes, inboxRes] = await Promise.all([
        fetch("/api/admin/orders"),
        fetch("/api/admin/inventory"),
        fetch("/api/admin/inbox"),
      ]);

      if (ordersRes.status === 401 || invRes.status === 401 || inboxRes.status === 401) {
        setAuthenticated(false);
        return;
      }

      const [ordersData, invData, inboxData] = await Promise.all([
        ordersRes.json(),
        invRes.json(),
        inboxRes.json(),
      ]);

      if (ordersData.ok) setOrders(ordersData.orders || []);
      if (invData.ok) setGarments(invData.garments || []);
      if (inboxData.ok) {
        setMessages(inboxData.contactMessages || []);
        setSubscribers(inboxData.dropSubscribers || []);
      }
    } catch (err) {
      console.error("Error loading admin dashboard data:", err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadAllData();
    }
  }, [authenticated, loadAllData]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode) return;
    setLoggingIn(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setAuthenticated(true);
        setPasscode("");
      } else {
        setAuthError(data.error || "Incorrect atelier passcode.");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      setAuthenticated(false);
    }
  }

  async function handleUpdateOrderStatus(orderId: string, newStatus: OrderItem["status"]) {
    setStatusUpdating((prev) => ({ ...prev, [orderId]: true }));
    setStatusSuccess((prev) => ({ ...prev, [orderId]: "" }));

    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatusSuccess((prev) => ({ ...prev, [orderId]: "Saved ✓" }));
        setTimeout(() => {
          setStatusSuccess((prev) => {
            const next = { ...prev };
            delete next[orderId];
            return next;
          });
        }, 2500);
      } else {
        alert(data.error || "Failed to update order status");
        loadAllData();
      }
    } catch {
      alert("Network error updating status");
      loadAllData();
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [orderId]: false }));
    }
  }

  async function handleSaveVariantStock(variantId: string, newQty: number) {
    setInventorySaving((prev) => ({ ...prev, [variantId]: true }));
    setInventorySuccess((prev) => ({ ...prev, [variantId]: "" }));

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, stockQty: newQty }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setInventorySuccess((prev) => ({ ...prev, [variantId]: "✓ Saved" }));
        setTimeout(() => {
          setInventorySuccess((prev) => {
            const next = { ...prev };
            delete next[variantId];
            return next;
          });
        }, 2200);
      } else {
        alert(data.error || "Failed to save stock quantity");
      }
    } catch {
      alert("Network error saving stock");
    } finally {
      setInventorySaving((prev) => ({ ...prev, [variantId]: false }));
    }
  }

  async function handleSaveGarmentPrice(garmentId: string, priceKobo: number) {
    setInventorySaving((prev) => ({ ...prev, [garmentId]: true }));
    setInventorySuccess((prev) => ({ ...prev, [garmentId]: "" }));

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ garmentId, priceKobo }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setInventorySuccess((prev) => ({ ...prev, [garmentId]: "✓ Price Updated" }));
        setTimeout(() => {
          setInventorySuccess((prev) => {
            const next = { ...prev };
            delete next[garmentId];
            return next;
          });
        }, 2500);
      } else {
        alert(data.error || "Failed to update garment price");
      }
    } catch {
      alert("Network error updating garment price");
    } finally {
      setInventorySaving((prev) => ({ ...prev, [garmentId]: false }));
    }
  }

  function handleCopyAllEmails() {
    if (subscribers.length === 0) return;
    const emailList = subscribers.map((s) => s.email).join("\n");
    navigator.clipboard.writeText(emailList).then(() => {
      setCopiedEmails(true);
      setTimeout(() => setCopiedEmails(false), 2400);
    });
  }

  // -------------------------------------------------------------
  // VIEW A: Unauthenticated Passcode Gate
  // -------------------------------------------------------------
  if (!authenticated) {
    return (
      <main className="min-h-[80vh] w-full flex items-center justify-center px-4 py-16 bg-[#F9F8F6]">
        <div className="w-full max-w-md bg-white border border-[#141413]/12 p-8 md:p-10 shadow-[0_20px_48px_rgba(20,20,19,0.06)] rounded-sm">
          <div className="text-center mb-8 border-b border-[var(--hairline)] pb-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--ink-muted)] block mb-2">
              BLACKO STORES • ATELIER ADMIN
            </span>
            <h1 className="font-editorial text-3xl md:text-4xl font-medium text-[#141413]">
              Studio Sign In
            </h1>
            <p className="text-xs text-[var(--ink-muted)] mt-2 leading-relaxed">
              Enter your atelier passcode to manage inventory, update orders, and review customer inquiries.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--ink-muted)] mb-1.5">
                Passcode
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (authError) setAuthError(null);
                }}
                disabled={loggingIn}
                placeholder="••••••••••••"
                required
                className="w-full px-4 py-3 bg-[#F9F8F6] border border-[#141413]/20 rounded-sm text-sm font-mono tracking-widest text-[#141413] focus:outline-none focus:border-[#141413]"
              />
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-mono rounded-sm">
                ✕ {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="mt-2 w-full py-3.5 bg-[#141413] text-[#F9F8F6] text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#2B2B28] disabled:opacity-50 transition rounded-sm shadow"
            >
              {loggingIn ? "Verifying..." : "Enter Atelier →"}
            </button>
          </form>

          <p className="mt-8 text-center text-[10px] font-mono text-[var(--ink-muted)]">
            Blacko Stores Ltd. • Lekki Phase 1, Lagos, Nigeria
          </p>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // VIEW B: Authenticated Studio Dashboard
  // -------------------------------------------------------------
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== "PENDING" ? o.totalKobo : 0), 0);
  const pendingOrAtelierCount = orders.filter(
    (o) => o.status === "PENDING" || o.status === "IN_ATELIER" || o.status === "PAID"
  ).length;

  return (
    <main className="w-full min-h-screen bg-[#F9F8F6] text-[#141413] pb-24">
      {/* Top Console Bar */}
      <div className="w-full bg-[#F2F0EC] border-b border-[var(--hairline)] px-6 md:px-12 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#141413] font-medium">
            ATELIER CONSOLE • BLACKO STORES LAGOS
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={loadAllData}
            disabled={loadingData}
            className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)] hover:text-[#141413] transition"
          >
            {loadingData ? "Refreshing..." : "↻ Refresh"}
          </button>
          <span className="text-xs text-[var(--ink-muted)]">•</span>
          <button
            onClick={handleLogout}
            className="text-[11px] font-mono uppercase tracking-wider text-red-700 hover:text-red-900 transition font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 md:pt-12">
        {/* Editorial Dashboard Title */}
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 border-b border-[var(--hairline)] pb-6 mb-8">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
              Operations &amp; Archive Management
            </span>
            <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[#141413] mt-1">
              Atelier Dashboard
            </h1>
          </div>
          <p className="font-mono text-xs text-[var(--ink-muted)]">
            Live Storefront: <span className="text-[#141413] font-medium">DROP 01 Active</span>
          </p>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-white p-5 border border-[#141413]/10 rounded-sm shadow-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)] block mb-1">
              Total Orders
            </span>
            <span className="font-editorial text-3xl md:text-4xl font-medium text-[#141413]">
              {orders.length}
            </span>
            <span className="font-mono text-[10px] text-[var(--ink-muted)] block mt-1">
              Lifetime purchases
            </span>
          </div>

          <div className="bg-white p-5 border border-[#141413]/10 rounded-sm shadow-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)] block mb-1">
              Pending / In Atelier
            </span>
            <span className="font-editorial text-3xl md:text-4xl font-medium text-[#141413]">
              {pendingOrAtelierCount}
            </span>
            <span className="font-mono text-[10px] text-amber-700 block mt-1">
              Requires attention
            </span>
          </div>

          <div className="bg-white p-5 border border-[#141413]/10 rounded-sm shadow-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)] block mb-1">
              Settled Revenue
            </span>
            <span className="font-mono text-xl md:text-2xl font-semibold text-[#141413] block mt-1">
              {formatNaira(totalRevenue)}
            </span>
            <span className="font-mono text-[10px] text-[var(--ink-muted)] block mt-1">
              Paid / Dispatched orders
            </span>
          </div>

          <div className="bg-white p-5 border border-[#141413]/10 rounded-sm shadow-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)] block mb-1">
              VIP Drop List
            </span>
            <span className="font-editorial text-3xl md:text-4xl font-medium text-[#141413]">
              {subscribers.length}
            </span>
            <span className="font-mono text-[10px] text-emerald-700 block mt-1">
              Verified subscribers
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--hairline)] mb-8 overflow-x-auto">
          {[
            { id: "orders", label: `Orders (${orders.length})` },
            { id: "inventory", label: `Inventory (${garments.length})` },
            { id: "messages", label: `Messages (${messages.length})` },
            { id: "drop_list", label: `Drop List (${subscribers.length})` },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={
                  "px-6 py-3 font-mono text-xs uppercase tracking-[0.16em] transition border-b-2 whitespace-nowrap " +
                  (active
                    ? "border-[#141413] text-[#141413] font-semibold"
                    : "border-transparent text-[var(--ink-muted)] hover:text-[#141413]")
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* --------------------------------------------------------- */}
        {/* TAB 1: ORDERS                                             */}
        {/* --------------------------------------------------------- */}
        {activeTab === "orders" && (
          <section className="bg-white border border-[#141413]/10 rounded-sm shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--hairline)] flex items-center justify-between bg-[#FDFDFB]">
              <div>
                <h3 className="font-medium text-base text-[#141413]">Atelier Orders &amp; Dispatches</h3>
                <p className="text-xs text-[var(--ink-muted)] font-mono mt-0.5">
                  Update status to reflect live in customer lookup tracker.
                </p>
              </div>
              <span className="font-mono text-xs text-[var(--ink-muted)]">
                {orders.length} orders recorded
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono text-[var(--ink-muted)]">
                No orders placed yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F7F3] border-b border-[var(--hairline)] font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                    <tr>
                      <th className="px-6 py-3">Reference</th>
                      <th className="px-6 py-3">Customer</th>
                      <th className="px-6 py-3">Delivery Destination</th>
                      <th className="px-6 py-3">Total Amount</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Order Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--hairline)] font-sans">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-[#FBFBFA] transition">
                        <td className="px-6 py-4 font-mono font-medium text-xs text-[#141413]">
                          {o.paystackReference}
                        </td>
                        <td className="px-6 py-4 text-[#141413]">
                          <span className="block font-medium">{o.customerEmail}</span>
                        </td>
                        <td className="px-6 py-4 text-[var(--ink-muted)] max-w-xs truncate">
                          {o.deliveryAddress || "Lagos, Nigeria"}
                        </td>
                        <td className="px-6 py-4 font-mono font-medium text-[#141413]">
                          {formatNaira(o.totalKobo)}
                        </td>
                        <td className="px-6 py-4 font-mono text-[11px] text-[var(--ink-muted)]">
                          {new Date(o.createdAt).toLocaleDateString("en-NG", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={o.status}
                              disabled={statusUpdating[o.id]}
                              onChange={(e) =>
                                handleUpdateOrderStatus(
                                  o.id,
                                  e.target.value as OrderItem["status"]
                                )
                              }
                              className={
                                "text-xs font-mono px-2.5 py-1.5 border rounded-sm focus:outline-none transition " +
                                (o.status === "DELIVERED"
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                                  : o.status === "DISPATCHED"
                                  ? "border-blue-500 bg-blue-50 text-blue-900"
                                  : o.status === "IN_ATELIER"
                                  ? "border-amber-500 bg-amber-50 text-amber-900 font-medium"
                                  : o.status === "PAID"
                                  ? "border-indigo-500 bg-indigo-50 text-indigo-900 font-medium"
                                  : "border-gray-300 bg-gray-50 text-gray-800")
                              }
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="PAID">PAID</option>
                              <option value="IN_ATELIER">IN_ATELIER</option>
                              <option value="DISPATCHED">DISPATCHED</option>
                              <option value="DELIVERED">DELIVERED</option>
                            </select>
                            {statusSuccess[o.id] && (
                              <span className="font-mono text-[11px] text-emerald-600 font-medium animate-pulse">
                                {statusSuccess[o.id]}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* --------------------------------------------------------- */}
        {/* TAB 2: INVENTORY                                          */}
        {/* --------------------------------------------------------- */}
        {activeTab === "inventory" && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-4">
              <div>
                <h3 className="font-medium text-base text-[#141413]">Shirting Stock &amp; Sizing Matrix</h3>
                <p className="text-xs text-[var(--ink-muted)] font-mono mt-0.5">
                  Real-time stock controls and price adjustments in Neon Postgres.
                </p>
              </div>
              <span className="font-mono text-xs text-[var(--ink-muted)]">
                {garments.length} shirting models
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {garments.map((garment) => (
                <div
                  key={garment.id}
                  className="bg-white border border-[#141413]/10 p-6 rounded-sm shadow-sm flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Sprite + Title + Price */}
                    <div className="flex items-center gap-4 border-b border-[var(--hairline)] pb-4">
                      <div className="w-16 h-16 bg-[#F9F8F6] border border-[#141413]/10 p-1 flex-shrink-0">
                        <img
                          src={garment.frontImgUrl}
                          alt={garment.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-sans font-medium text-base text-[#141413] truncate">
                          {garment.title}
                        </h4>
                        <p className="text-xs text-[var(--ink-muted)] line-clamp-1 mt-0.5">
                          {garment.fabric} • {garment.fit}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="font-mono text-xs text-[#141413] font-semibold">
                            {formatNaira(garment.priceKobo)}
                          </span>
                          {inventorySuccess[garment.id] && (
                            <span className="font-mono text-[10px] text-emerald-600 font-medium">
                              {inventorySuccess[garment.id]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sizing Stock Controls */}
                    <div className="mt-5">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)] block mb-3">
                        Variant Inventory (Units)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {garment.variants.map((v) => (
                          <div
                            key={v.id}
                            className="bg-[#FBFBFA] border border-[#141413]/12 p-2.5 rounded text-center flex flex-col justify-between"
                          >
                            <span className="font-mono text-xs font-semibold text-[#141413]">
                              Size {v.size}
                            </span>
                            <div className="flex items-center justify-center gap-2 my-2">
                              <button
                                type="button"
                                disabled={v.stockQty <= 0 || inventorySaving[v.id]}
                                onClick={() => {
                                  const next = Math.max(0, v.stockQty - 1);
                                  // update local state
                                  setGarments((prev) =>
                                    prev.map((g) =>
                                      g.id === garment.id
                                        ? {
                                            ...g,
                                            variants: g.variants.map((varItem) =>
                                              varItem.id === v.id ? { ...varItem, stockQty: next } : varItem
                                            ),
                                          }
                                        : g
                                    )
                                  );
                                  handleSaveVariantStock(v.id, next);
                                }}
                                className="w-6 h-6 flex items-center justify-center border border-[#141413]/30 hover:border-[#141413] bg-white text-xs font-mono font-medium disabled:opacity-30 rounded-sm"
                              >
                                −
                              </button>
                              <span className="font-mono text-sm font-semibold w-6 text-center text-[#141413]">
                                {v.stockQty}
                              </span>
                              <button
                                type="button"
                                disabled={inventorySaving[v.id]}
                                onClick={() => {
                                  const next = v.stockQty + 1;
                                  // update local state
                                  setGarments((prev) =>
                                    prev.map((g) =>
                                      g.id === garment.id
                                        ? {
                                            ...g,
                                            variants: g.variants.map((varItem) =>
                                              varItem.id === v.id ? { ...varItem, stockQty: next } : varItem
                                            ),
                                          }
                                        : g
                                    )
                                  );
                                  handleSaveVariantStock(v.id, next);
                                }}
                                className="w-6 h-6 flex items-center justify-center border border-[#141413]/30 hover:border-[#141413] bg-white text-xs font-mono font-medium rounded-sm"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-[10px] font-mono text-[var(--ink-muted)]">
                              {v.stockQty < 3 ? (
                                <span className="text-red-700 font-medium">Low Stock</span>
                              ) : (
                                "In Stock"
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Inline Price Adjustment Modal / Accordion */}
                  <div className="mt-6 pt-4 border-t border-[var(--hairline)] flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                      {garment.weightGsm}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newPriceStr = window.prompt(
                          `Update price for ${garment.title} (in Naira):`,
                          String(garment.priceKobo / 100)
                        );
                        if (newPriceStr) {
                          const parsedNaira = parseFloat(newPriceStr.replace(/,/g, ""));
                          if (!isNaN(parsedNaira) && parsedNaira > 0) {
                            const newKobo = Math.round(parsedNaira * 100);
                            setGarments((prev) =>
                              prev.map((g) => (g.id === garment.id ? { ...g, priceKobo: newKobo } : g))
                            );
                            handleSaveGarmentPrice(garment.id, newKobo);
                          }
                        }
                      }}
                      className="px-3 py-1.5 border border-[#141413]/25 hover:border-[#141413] text-xs font-mono uppercase tracking-wider rounded-sm"
                    >
                      Edit Price ✎
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* --------------------------------------------------------- */}
        {/* TAB 3: MESSAGES (CONTACT)                                 */}
        {/* --------------------------------------------------------- */}
        {activeTab === "messages" && (
          <section className="bg-white border border-[#141413]/10 rounded-sm shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--hairline)] flex items-center justify-between bg-[#FDFDFB]">
              <div>
                <h3 className="font-medium text-base text-[#141413]">Customer Concierge Inquiries</h3>
                <p className="text-xs text-[var(--ink-muted)] font-mono mt-0.5">
                  Messages received via /contact form in Neon Postgres.
                </p>
              </div>
              <span className="font-mono text-xs text-[var(--ink-muted)]">
                {messages.length} inquiries
              </span>
            </div>

            {messages.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono text-[var(--ink-muted)]">
                No customer inquiries received yet.
              </div>
            ) : (
              <div className="divide-y divide-[var(--hairline)]">
                {messages.map((msg) => (
                  <div key={msg.id} className="p-6 hover:bg-[#FBFBFA] transition">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-sans font-semibold text-sm text-[#141413]">
                          {msg.name}
                        </span>
                        <span className="text-xs font-mono text-[var(--ink-muted)]">
                          &lt;{msg.email}&gt;
                        </span>
                        <span className="bg-[#141413] text-[#F9F8F6] text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm">
                          {msg.subject}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                        {new Date(msg.createdAt).toLocaleDateString("en-NG", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="text-xs md:text-sm text-[#3E3C38] leading-relaxed mt-3 whitespace-pre-wrap">
                      {msg.message}
                    </p>

                    <div className="mt-4 pt-3 border-t border-[var(--hairline)] flex items-center gap-4">
                      <a
                        href={`mailto:${msg.email}?subject=${encodeURIComponent(
                          `Re: ${msg.subject} — Blacko Stores Atelier`
                        )}`}
                        className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#141413] hover:underline font-medium"
                      >
                        <span>Reply via Email ✉</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* --------------------------------------------------------- */}
        {/* TAB 4: DROP LIST (SUBSCRIBERS)                            */}
        {/* --------------------------------------------------------- */}
        {activeTab === "drop_list" && (
          <section className="bg-white border border-[#141413]/10 rounded-sm shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FDFDFB]">
              <div>
                <h3 className="font-medium text-base text-[#141413]">Private Drop Subscribers</h3>
                <p className="text-xs text-[var(--ink-muted)] font-mono mt-0.5">
                  Verified collectors opted in for early 1-hour reservation links.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyAllEmails}
                disabled={subscribers.length === 0}
                className="px-4 py-2 bg-[#141413] text-[#F9F8F6] text-xs font-mono uppercase tracking-wider rounded-sm hover:bg-[#2B2B28] disabled:opacity-40 transition flex items-center gap-2 self-start sm:self-auto"
              >
                <span>{copiedEmails ? "✓ Copied to Clipboard!" : "Copy All Emails 📋"}</span>
              </button>
            </div>

            {subscribers.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono text-[var(--ink-muted)]">
                No drop subscribers yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F7F3] border-b border-[var(--hairline)] font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                    <tr>
                      <th className="px-6 py-3">#</th>
                      <th className="px-6 py-3">Subscriber Email</th>
                      <th className="px-6 py-3">Subscription Date</th>
                      <th className="px-6 py-3">Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--hairline)] font-sans">
                    {subscribers.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-[#FBFBFA] transition">
                        <td className="px-6 py-3.5 font-mono text-[11px] text-[var(--ink-muted)]">
                          {idx + 1}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-xs text-[#141413] font-medium">
                          {s.email}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-[11px] text-[var(--ink-muted)]">
                          {new Date(s.createdAt).toLocaleDateString("en-NG", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono uppercase rounded-sm">
                            Priority Access
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
