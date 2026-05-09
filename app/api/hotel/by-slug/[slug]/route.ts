import { NextRequest, NextResponse } from "next/server";
import { getOrgBySlug } from "@/lib/org-service";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const org = await getOrgBySlug(params.slug);

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  return NextResponse.json(org);
}
