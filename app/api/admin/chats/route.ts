import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function getAuthClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = request.nextUrl.searchParams.get("orgId");
    if (!orgId) {
      return NextResponse.json({ error: "orgId is required" }, { status: 400 });
    }

    // Verify ownership
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("id", orgId)
      .eq("owner_id", user.id)
      .single();

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Fetch sessions with message count
    const { data: sessions, error } = await supabaseAdmin
      .from("chat_sessions")
      .select("id, guest_name, created_at, updated_at, chat_messages(count)")
      .eq("org_id", orgId)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[chats] List error:", error);
      return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
    }

    // Flatten the count
    const result = (sessions ?? []).map((s: Record<string, unknown>) => {
      const msgs = s.chat_messages as Array<{ count: number }> | undefined;
      return {
        id: s.id,
        guest_name: s.guest_name,
        created_at: s.created_at,
        updated_at: s.updated_at,
        message_count: msgs?.[0]?.count ?? 0,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[chats] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
