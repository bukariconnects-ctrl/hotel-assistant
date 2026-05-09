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

    const { name, slug, description, category } = (await request.json()) as {
      name: string;
      slug: string;
      description?: string;
      category?: string;
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
      .from("organizations")
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
    const { data: org, error: insertError } = await supabaseAdmin
      .from("organizations")
      .insert({
        id: crypto.randomUUID(),
        name: name.trim(),
        slug: normalizedSlug,
        description: description?.trim() || null,
        category: category?.trim() || "general",
        owner_id: user.id,
        status: "active",
        created_at: now,
        updated_at: now,
      })
      .select("id, name, slug, category")
      .single();

    if (insertError) {
      console.error("[organizations] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create organization" },
        { status: 500 }
      );
    }

    return NextResponse.json(org, { status: 201 });
  } catch (err) {
    console.error("[organizations] Error:", err);
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

    const { orgId, name, description, category, welcomeMessage, contactPhone, website, location } = (await request.json()) as {
      orgId: string;
      name?: string;
      description?: string;
      category?: string;
      welcomeMessage?: string | null;
      contactPhone?: string | null;
      website?: string | null;
      location?: string | null;
    };

    if (!orgId) {
      return NextResponse.json(
        { error: "orgId is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("id", orgId)
      .eq("owner_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (category !== undefined) updates.category = category?.trim() || "general";
    if (welcomeMessage !== undefined) updates.welcome_message = welcomeMessage?.trim() || null;
    if (contactPhone !== undefined) updates.contact_phone = contactPhone?.trim() || null;
    if (website !== undefined) updates.website = website?.trim() || null;
    if (location !== undefined) updates.location = location?.trim() || null;

    const { data: org, error: updateError } = await supabaseAdmin
      .from("organizations")
      .update(updates)
      .eq("id", orgId)
      .select("id, name, slug, description, category, welcome_message, contact_phone, website, location, status")
      .single();

    if (updateError) {
      console.error("[organizations] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update organization" },
        { status: 500 }
      );
    }

    return NextResponse.json(org);
  } catch (err) {
    console.error("[organizations] PATCH error:", err);
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

    const { data: orgs, error } = await supabaseAdmin
      .from("organizations")
      .select("id, name, slug, description, category, welcome_message, contact_phone, website, location, status, created_at")
      .eq("owner_id", user.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch organizations" },
        { status: 500 }
      );
    }

    return NextResponse.json(orgs ?? []);
  } catch (err) {
    console.error("[organizations] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
