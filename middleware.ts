import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // ── Clean up stale chunked Supabase auth cookies (prevents HTTP 431) ──
  const allCookies = request.cookies.getAll();
  const authCookieChunks = allCookies.filter(
    (c) => c.name.includes("-auth-token") && /\.\d+$/.test(c.name)
  );
  // If there are too many chunks (>4), clear them to prevent 431
  if (authCookieChunks.length > 4) {
    const res = NextResponse.redirect(request.url);
    for (const cookie of authCookieChunks) {
      res.cookies.delete(cookie.name);
    }
    // Also clear the base auth token cookie
    const baseCookies = allCookies.filter(
      (c) => c.name.includes("-auth-token") && !/\.\d+$/.test(c.name)
    );
    for (const cookie of baseCookies) {
      res.cookies.delete(cookie.name);
    }
    return res;
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the auth token (important for server components)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /admin routes — redirect to /login if not authenticated
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /api/admin routes — return 401 if not authenticated
  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/login", "/register"],
};
