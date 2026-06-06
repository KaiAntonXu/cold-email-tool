import type { SupabaseClient } from "@supabase/supabase-js";

export const FREE_EMAIL_LIMIT = 3;

export const USAGE_LIMIT_MESSAGE =
  "Du hast dein kostenloses Limit erreicht. Upgrade auf Pro für unbegrenzte Emails.";

export type UserUsage = {
  email_count: number;
  is_pro: boolean;
};

export async function getOrCreateUserUsage(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ usage: UserUsage | null; error: string | null }> {
  const { data: existing, error: selectError } = await supabase
    .from("user_usage")
    .select("email_count, is_pro")
    .eq("user_id", userId)
    .maybeSingle();

  if (selectError) {
    return { usage: null, error: selectError.message };
  }

  if (existing) {
    return { usage: existing, error: null };
  }

  const { data: created, error: insertError } = await supabase
    .from("user_usage")
    .insert({ user_id: userId, email_count: 0, is_pro: false })
    .select("email_count, is_pro")
    .single();

  if (insertError) {
    const { data: retry, error: retryError } = await supabase
      .from("user_usage")
      .select("email_count, is_pro")
      .eq("user_id", userId)
      .single();

    if (retryError) {
      return { usage: null, error: retryError.message };
    }

    return { usage: retry, error: null };
  }

  return { usage: created, error: null };
}

export function isUsageLimitReached(usage: UserUsage): boolean {
  return !usage.is_pro && usage.email_count >= FREE_EMAIL_LIMIT;
}

export function remainingFreeEmails(usage: UserUsage): number | null {
  if (usage.is_pro) return null;
  return Math.max(0, FREE_EMAIL_LIMIT - usage.email_count);
}
