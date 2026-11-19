import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { isRequestAdminAuthenticated } from "@/lib/admin-auth";

const statusSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
  status: z.enum(["PENDING", "PAID", "IN_ATELIER", "DISPATCHED", "DELIVERED"]),
});

export async function GET(req: Request) {
  if (!isRequestAdminAuthenticated(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({
        ok: true,
        orders: [
          {
            id: "00000000-0000-4000-8000-000000000099",
            paystackReference: "BLK-LAG-849201",
            customerEmail: "collector@blackostores.com",
            deliveryAddress: "Victoria Island, Lagos",
            totalKobo: 15300000,
            status: "IN_ATELIER",
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }

    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    return NextResponse.json({ ok: true, orders: allOrders });
  } catch (err) {
    console.error("Admin orders fetch error:", err);
    return NextResponse.json({ ok: false, error: "Failed to load orders" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!isRequestAdminAuthenticated(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.errors[0]?.message || "Invalid status payload" },
        { status: 400 }
      );
    }

    const { orderId, status } = parsed.data;
    const db = getDb();
    if (!db) {
      return NextResponse.json({
        ok: true,
        order: { id: orderId, status },
        mode: "local",
      });
    }

    const updated = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, orderId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, order: updated[0] });
  } catch (err) {
    console.error("Admin order status update error:", err);
    return NextResponse.json({ ok: false, error: "Failed to update order status" }, { status: 500 });
  }
}
