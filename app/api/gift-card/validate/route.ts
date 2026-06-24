import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { validateGiftCertificateCode } from "@/lib/gift-certificates";

// Simple in-memory rate limiter: 10 attempts per IP per minute
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function GET(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (rateLimit(ip)) {
    return NextResponse.json({ valid: false, message: "Too many requests. Please wait before trying again." }, { status: 429 });
  }
  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase();
  if (!code) return NextResponse.json({ valid: false, message: "No code provided." });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ valid: false, message: "Service unavailable." });

  const result = await validateGiftCertificateCode(supabase, code);
  if (!result.valid) return NextResponse.json({ valid: false, message: result.message });

  return NextResponse.json({
    valid: true,
    code_id: result.code.id,
    message: result.code.description || "Gift certificate applied. No deposit is due today."
  });
}
