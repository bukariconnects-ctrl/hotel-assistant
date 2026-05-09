import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { data: orgs, error } = await supabaseAdmin
    .from("organizations")
    .select("id, name, slug, description, category")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[organizations] Public list error:", error);
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json(orgs ?? []);
}
