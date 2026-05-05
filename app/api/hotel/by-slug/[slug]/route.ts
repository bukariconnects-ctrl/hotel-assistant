import { NextRequest, NextResponse } from "next/server";
import { getHotelBySlug } from "@/lib/hotel-service";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const hotel = await getHotelBySlug(params.slug);

  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  return NextResponse.json(hotel);
}
