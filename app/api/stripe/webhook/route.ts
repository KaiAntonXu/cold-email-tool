import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

async function setUserPro(userId: string) {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("user_usage")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("user_usage")
      .update({ is_pro: true })
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to update user_usage: ${error.message}`);
    }
    return;
  }

  const { error } = await supabase.from("user_usage").insert({
    user_id: userId,
    email_count: 0,
    is_pro: true,
  });

  if (error) {
    throw new Error(`Failed to create user_usage: ${error.message}`);
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 },
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;

    if (!userId) {
      console.error("checkout.session.completed without user_id in metadata");
      return NextResponse.json({ received: true });
    }

    try {
      await setUserPro(userId);
    } catch (error) {
      console.error("Failed to set user pro:", error);
      return NextResponse.json(
        { error: "Failed to update subscription status" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ received: true });
}
