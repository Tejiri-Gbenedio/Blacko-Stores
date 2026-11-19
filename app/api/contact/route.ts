import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { contactMessages } from "@/db/schema";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().trim().email("Please provide a valid email address"),
  subject: z.string().trim().min(2, "Subject is required").max(160),
  message: z.string().trim().min(5, "Message must be at least 5 characters").max(4000),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const result = contactSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error.errors[0]?.message || "Invalid contact form data" },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = result.data;
    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { ok: true, mode: "local", message: "Message received. Our Lagos studio will reply within 24 hours." },
        { status: 201 }
      );
    }

    await db.insert(contactMessages).values({
      name,
      email,
      subject,
      message,
    });

    return NextResponse.json(
      { ok: true, message: "Message received. Our Lagos studio will reply within 24 hours." },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Error saving contact message:", err);
    return NextResponse.json(
      { ok: false, error: "Unable to process message right now. Please try again or WhatsApp our studio." },
      { status: 500 }
    );
  }
}
