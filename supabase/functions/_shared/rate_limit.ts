// DB-backed sliding-window rate limiter for Edge Functions.
// Requires the public.rate_limit_attempts table (see migration).

type SupabaseLike = {
  from: (table: string) => {
    select: (cols: string, opts?: { count: "exact"; head: true }) => {
      eq: (col: string, val: string) => {
        eq: (col: string, val: string) => {
          gte: (col: string, val: string) => Promise<{ count: number | null; error: unknown }>;
        };
      };
    };
    insert: (row: Record<string, unknown>) => Promise<{ error: unknown }>;
  };
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export async function checkRateLimit(
  supabase: SupabaseLike,
  endpoint: string,
  identifier: string,
  limit: number,
  windowMinutes: number,
): Promise<RateLimitResult> {
  const windowMs = windowMinutes * 60 * 1000;
  const since = new Date(Date.now() - windowMs).toISOString();

  const { count, error } = await supabase
    .from("rate_limit_attempts")
    .select("id", { count: "exact", head: true })
    .eq("endpoint", endpoint)
    .eq("identifier", identifier)
    .gte("attempted_at", since);

  if (error) {
    // Fail-open on DB error so legitimate users aren't locked out by infra issues.
    // The error is logged; monitoring should alert on it.
    console.error("rate_limit check failed", error);
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }

  const used = count ?? 0;
  if (used >= limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds: windowMinutes * 60 };
  }

  await supabase.from("rate_limit_attempts").insert({ endpoint, identifier });

  return { allowed: true, remaining: limit - used - 1, retryAfterSeconds: 0 };
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
