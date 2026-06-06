import { createClient } from "@/lib/supabase/server";
import {
  FREE_EMAIL_LIMIT,
  getOrCreateUserUsage,
  isUsageLimitReached,
  remainingFreeEmails,
} from "@/lib/usage";
import { NextResponse } from "next/server";

export type UsageResponse = {
  email_count: number;
  is_pro: boolean;
  free_limit: number;
  remaining: number | null;
  limit_reached: boolean;
};

export async function GET() {
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

  const { usage, error } = await getOrCreateUserUsage(supabase, user.id);

  if (error || !usage) {
    return NextResponse.json(
      { error: "Nutzungsdaten konnten nicht geladen werden." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    email_count: usage.email_count,
    is_pro: usage.is_pro,
    free_limit: FREE_EMAIL_LIMIT,
    remaining: remainingFreeEmails(usage),
    limit_reached: isUsageLimitReached(usage),
  } satisfies UsageResponse);
}
