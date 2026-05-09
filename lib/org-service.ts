import { supabaseAdmin } from "@/lib/supabase";

export interface OrgRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  welcome_message: string | null;
  contact_phone: string | null;
  website: string | null;
  location: string | null;
  owner_id: string | null;
  status: string;
}

const ORG_SELECT = "id, name, slug, description, category, welcome_message, contact_phone, website, location, owner_id, status";

export async function getOrgBySlug(
  slug: string
): Promise<OrgRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("organizations")
    .select(ORG_SELECT)
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !data) return null;
  return data as OrgRecord;
}

export async function getOrgById(
  orgId: string
): Promise<OrgRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("organizations")
    .select(ORG_SELECT)
    .eq("id", orgId)
    .single();

  if (error || !data) return null;
  return data as OrgRecord;
}

export async function getOrgsByOwner(
  ownerId: string
): Promise<OrgRecord[]> {
  const { data, error } = await supabaseAdmin
    .from("organizations")
    .select(ORG_SELECT)
    .eq("owner_id", ownerId);

  if (error || !data) return [];
  return data as OrgRecord[];
}
