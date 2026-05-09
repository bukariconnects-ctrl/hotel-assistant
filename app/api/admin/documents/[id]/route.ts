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

async function verifyOwnership(userId: string, documentId: string) {
  const { data: doc } = await supabaseAdmin
    .from("documents")
    .select("id, org_id")
    .eq("id", documentId)
    .single();

  if (!doc) return null;

  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("id", doc.org_id)
    .eq("owner_id", userId)
    .single();

  return org ? doc : null;
}

// DELETE — remove document and all linked sections (CASCADE handles sections)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doc = await verifyOwnership(user.id, params.id);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete sections first (explicit cleanup even though CASCADE exists)
    await supabaseAdmin
      .from("document_sections")
      .delete()
      .eq("document_id", params.id);

    // Delete the document record
    const { error } = await supabaseAdmin
      .from("documents")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("[documents] Delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete document" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[documents] Delete error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH — toggle status (ready ↔ inactive)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doc = await verifyOwnership(user.id, params.id);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const body = await request.json();
    const { status } = body as { status?: string };

    if (!status || !["ready", "inactive"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'ready' or 'inactive'" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("documents")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", params.id);

    if (error) {
      console.error("[documents] Patch error:", error);
      return NextResponse.json(
        { error: "Failed to update document" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error("[documents] Patch error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
