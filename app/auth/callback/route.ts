import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * OAuth / magic-link landing point. Supabase redirects here with a `code`
 * which we exchange for a cookie-backed session.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await supabaseServer();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(
          new URL(`/?auth=error&reason=${encodeURIComponent(error.message)}`, url.origin)
        );
      }
    }
  }

  const safeNext = next.startsWith("/") ? next : "/";
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
