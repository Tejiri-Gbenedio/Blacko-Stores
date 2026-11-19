import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { orders } from "@/db/schema";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawRef = searchParams.get("ref");

    if (!rawRef || typeof rawRef !== "string" || !rawRef.trim()) {
      return NextResponse.json(
        { found: false, error: "Please provide an order reference (e.g. BLK-LAG-849201)." },
        { status: 400 }
      );
    }

    const ref = rawRef.trim().toUpperCase();
    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { found: false, error: "Order tracking service temporarily unavailable." },
        { status: 503 }
      );
    }

    const matchedOrders = await db
      .select({
        reference: orders.paystackReference,
        status: orders.status,
        totalKobo: orders.totalKobo,
        deliveryAddress: orders.deliveryAddress,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(sql`UPPER(${orders.paystackReference}) = ${ref}`)
      .limit(1);

    if (matchedOrders.length === 0) {
      return NextResponse.json(
        { found: false, error: "Order reference not found. Please verify your reference number." },
        { status: 404 }
      );
    }

    const item = matchedOrders[0];

    // Safely extract delivery city / region without exposing full street address
    let deliveryCity = "Lagos";
    if (item.deliveryAddress) {
      const parts = item.deliveryAddress
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length >= 2) {
        deliveryCity = `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
      } else if (parts.length === 1) {
        deliveryCity = parts[0];
      }
    }

    return NextResponse.json({
      found: true,
      order: {
        reference: item.reference,
        status: item.status,
        totalKobo: item.totalKobo,
        deliveryCity,
        createdAt: item.createdAt,
      },
    });
  } catch (err: unknown) {
    console.error("Order tracking error:", err);
    return NextResponse.json(
      { found: false, error: "An unexpected error occurred while tracking your order." },
      { status: 500 }
    );
  }
}
