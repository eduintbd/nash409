// Shared CORS helper for Edge Functions.
// Configure ALLOWED_ORIGINS as a comma-separated list in the Supabase project secrets.
// Server-to-server calls (no Origin header) pass through so cron/trigger invocations work.

export function getAllowedOrigins(): string[] {
  const raw = Deno.env.get("ALLOWED_ORIGINS") ?? "";
  return raw.split(",").map((o) => o.trim()).filter(Boolean);
}

export function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowed = getAllowedOrigins();
  const allowOrigin = allowed.includes(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

export function assertOriginAllowed(req: Request): Response | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  if (getAllowedOrigins().includes(origin)) return null;
  return new Response(
    JSON.stringify({ error: "Origin not allowed" }),
    { status: 403, headers: { "Content-Type": "application/json" } },
  );
}
