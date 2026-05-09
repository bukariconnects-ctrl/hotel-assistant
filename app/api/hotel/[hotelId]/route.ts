import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { hotelId: string } }
) {
  const { data: org, error } = await supabaseAdmin
    .from("organizations")
    .select("id, name, slug, description, category")
    .eq("id", params.hotelId)
    .single();

  if (error || !org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  return NextResponse.json(org);
}
