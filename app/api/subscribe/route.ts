import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { dropSubscribers } from "@/db/schema";

const subscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .toLowerCase(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const result = subscribeSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error.errors[0]?.message || "Invalid email address." },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const db = getDb();
    if (!db) {
      return NextResponse.json(
        {
          ok: true,
          status: "subscribed",
          mode: "local",
          message: "You have been added to the private drop list.",
        },
        { status: 201 }
      );
    }

    const inserted = await db
      .insert(dropSubscribers)
      .values({ email })
      .onConflictDoNothing({ target: dropSubscribers.email })
      .returning();

    if (inserted.length === 0) {
      return NextResponse.json(
        {
          ok: true,
          status: "already_subscribed",
          message: "You are already on our private drop list. We have your email noted.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        status: "subscribed",
        message: "You have been added to the private drop list.",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Error subscribing to drop list:", err);
    return NextResponse.json(
      { ok: false, error: "Unable to process subscription right now. Please try again." },
      { status: 500 }
    );
  }
}
