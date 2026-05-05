import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { hotelId: string } }
) {
  const { data: hotel, error } = await supabaseAdmin
    .from("hotels")
    .select("id, name, slug, description")
    .eq("id", params.hotelId)
    .single();

  if (error || !hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  return NextResponse.json(hotel);
}
