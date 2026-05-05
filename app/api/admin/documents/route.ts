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
      return NextResponse.json(
        { error: "hotelId is required" },
        { status: 400 }
      );
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

    const { data: documents, error } = await supabaseAdmin
      .from("documents")
      .select("id, file_name, file_type, file_size, status, category, created_at")
      .eq("hotel_id", hotelId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[documents] List error:", error);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    return NextResponse.json(documents ?? []);
  } catch (err) {
    console.error("[documents] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
