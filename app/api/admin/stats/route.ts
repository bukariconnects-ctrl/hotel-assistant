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

    const hotelId = request.nextUrl.searchParams.get("hotelId");
    if (!hotelId) {
      return NextResponse.json({ error: "hotelId is required" }, { status: 400 });
    }

    // Verify ownership
    const { data: hotel } = await supabaseAdmin
      .from("hotels")
      .select("id")
      .eq("id", hotelId)
      .eq("owner_id", user.id)
      .single();

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    // Fetch all 3 counts in parallel
    const [docsResult, sectionsResult, sessionsResult] = await Promise.all([
      supabaseAdmin
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("hotel_id", hotelId),
      supabaseAdmin
        .from("document_sections")
        .select("id", { count: "exact", head: true })
        .in(
          "document_id",
          // sub-select: get document IDs for this hotel
          (
            await supabaseAdmin
              .from("documents")
              .select("id")
              .eq("hotel_id", hotelId)
          ).data?.map((d: { id: string }) => d.id) ?? []
        ),
      supabaseAdmin
        .from("chat_sessions")
        .select("id", { count: "exact", head: true })
        .eq("hotel_id", hotelId),
    ]);

    return NextResponse.json({
      totalDocuments: docsResult.count ?? 0,
      totalSections: sectionsResult.count ?? 0,
      totalChatSessions: sessionsResult.count ?? 0,
    });
  } catch (err) {
    console.error("[stats] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
