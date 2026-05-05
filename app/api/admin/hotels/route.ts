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

export async function POST(request: NextRequest) {
  try {
    const supabase = getAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, slug, description } = (await request.json()) as {
      name: string;
      slug: string;
      description?: string;
    };

    if (!name?.trim() || !slug?.trim()) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (normalizedSlug !== slug) {
      return NextResponse.json(
        { error: "Slug must be lowercase, alphanumeric, and may contain hyphens" },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const { data: existing } = await supabaseAdmin
      .from("hotels")
      .select("id")
      .eq("slug", normalizedSlug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "This slug is already taken" },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const { data: hotel, error: insertError } = await supabaseAdmin
      .from("hotels")
      .insert({
        id: crypto.randomUUID(),
        name: name.trim(),
        slug: normalizedSlug,
        description: description?.trim() || null,
        owner_id: user.id,
        status: "active",
        created_at: now,
        updated_at: now,
      })
      .select("id, name, slug")
      .single();

    if (insertError) {
      console.error("[hotels] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create hotel" },
        { status: 500 }
      );
    }

    return NextResponse.json(hotel, { status: 201 });
  } catch (err) {
    console.error("[hotels] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = getAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hotelId, name, description, welcomeMessage, contactPhone, website, location } = (await request.json()) as {
      hotelId: string;
      name?: string;
      description?: string;
      welcomeMessage?: string | null;
      contactPhone?: string | null;
      website?: string | null;
      location?: string | null;
    };

    if (!hotelId) {
      return NextResponse.json(
        { error: "hotelId is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from("hotels")
      .select("id")
      .eq("id", hotelId)
      .eq("owner_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (welcomeMessage !== undefined) updates.welcome_message = welcomeMessage?.trim() || null;
    if (contactPhone !== undefined) updates.contact_phone = contactPhone?.trim() || null;
    if (website !== undefined) updates.website = website?.trim() || null;
    if (location !== undefined) updates.location = location?.trim() || null;

    const { data: hotel, error: updateError } = await supabaseAdmin
      .from("hotels")
      .update(updates)
      .eq("id", hotelId)
      .select("id, name, slug, description, welcome_message, contact_phone, website, location, status")
      .single();

    if (updateError) {
      console.error("[hotels] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update hotel" },
        { status: 500 }
      );
    }

    return NextResponse.json(hotel);
  } catch (err) {
    console.error("[hotels] PATCH error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = getAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: hotels, error } = await supabaseAdmin
      .from("hotels")
      .select("id, name, slug, description, welcome_message, contact_phone, website, location, status, created_at")
      .eq("owner_id", user.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch hotels" },
        { status: 500 }
      );
    }

    return NextResponse.json(hotels ?? []);
  } catch (err) {
    console.error("[hotels] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
