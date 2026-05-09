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

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get session and verify ownership through organization
    const { data: session } = await supabaseAdmin
      .from("chat_sessions")
      .select("id, org_id, guest_name, created_at")
      .eq("id", params.id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("id", session.org_id)
      .eq("owner_id", user.id)
      .single();

    if (!org) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Fetch all messages for this session
    const { data: messages, error } = await supabaseAdmin
      .from("chat_messages")
      .select("id, role, content, metadata, created_at")
      .eq("session_id", params.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[chats] Messages error:", error);
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }

    return NextResponse.json({
      session: {
        id: session.id,
        guest_name: session.guest_name,
        created_at: session.created_at,
      },
      messages: messages ?? [],
    });
  } catch (err) {
    console.error("[chats] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
