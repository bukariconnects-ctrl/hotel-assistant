import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { data: hotels, error } = await supabaseAdmin
    .from("hotels")
    .select("id, name, slug, description")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[hotels] Public list error:", error);
    return NextResponse.json([], { status: 200 });
  }

  console.log(`[hotels] Returning ${hotels?.length ?? 0} hotels:`, hotels?.map(h => h.name));

  const res = NextResponse.json(hotels ?? []);
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}
