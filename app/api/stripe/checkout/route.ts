import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Nicht autorisiert. Bitte anmelden." },
      { status: 401 },
    );
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe ist nicht konfiguriert." },
      { status: 500 },
    );
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { user_id: user.id },
      success_url: `${origin}/?upgraded=1`,
      cancel_url: `${origin}/?upgrade_cancelled=1`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Checkout-Session konnte nicht erstellt werden." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Checkout konnte nicht gestartet werden." },
      { status: 500 },
    );
  }
}
