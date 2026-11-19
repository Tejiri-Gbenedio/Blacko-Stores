import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "node:crypto";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { getOrCreateBagSession } from "@/lib/session";

const checkoutSchema = z.object({
  email: z.string().email(),
  deliveryAddress: z.string().min(5).max(250),
  totalKobo: z.number().int().positive(),
  items: z.array(
    z.object({
      title: z.string(),
      size: z.string(),
      priceKobo: z.number().int().positive(),
    })
  ).min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid email and Nigerian delivery address." },
      { status: 400 }
    );
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  const reference = "BLK-" + crypto.randomBytes(6).toString("hex").toUpperCase();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const db = getDb();
  const sessionInfo = db ? await getOrCreateBagSession() : null;

  if (db) {
    await db.insert(orders).values({
      sessionId: sessionInfo?.session.id ?? null,
      paystackReference: reference,
      customerEmail: parsed.data.email,
      deliveryAddress: parsed.data.deliveryAddress,
      totalKobo: parsed.data.totalKobo,
      status: "PENDING",
    });
  }

  if (!paystackSecret || paystackSecret.includes("replace_with")) {
    return NextResponse.json({
      demoMode: true,
      reference,
      message:
        "Order logged in demo mode. Add your real PAYSTACK_SECRET_KEY in .env.local to launch live Naira checkout.",
    });
  }

  const psRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + paystackSecret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: parsed.data.email,
      amount: parsed.data.totalKobo, // Paystack expects amount in kobo (NGN)
      currency: "NGN",
      reference,
      callback_url: appUrl + "/?paid=" + reference,
      metadata: {
        brand: "Blacko Stores",
        deliveryAddress: parsed.data.deliveryAddress,
        items: parsed.data.items,
      },
    }),
  });

  const psJson = await psRes.json();
  if (!psRes.ok || !psJson.status) {
    return NextResponse.json(
      { error: psJson.message || "Paystack initialization failed" },
      { status: 502 }
    );
  }

  return NextResponse.json({
    authorizationUrl: psJson.data.authorization_url,
    reference,
  });
}
