import { supabaseAdmin } from "@/lib/supabase";

export interface HotelRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  welcome_message: string | null;
  contact_phone: string | null;
  website: string | null;
  location: string | null;
  owner_id: string | null;
  status: string;
}

export async function getHotelBySlug(
  slug: string
): Promise<HotelRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("hotels")
    .select("id, name, slug, description, welcome_message, contact_phone, website, location, owner_id, status")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !data) return null;
  return data as HotelRecord;
}

export async function getHotelById(
  hotelId: string
): Promise<HotelRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("hotels")
    .select("id, name, slug, description, welcome_message, contact_phone, website, location, owner_id, status")
    .eq("id", hotelId)
    .single();

  if (error || !data) return null;
  return data as HotelRecord;
}

export async function getHotelsByOwner(
  ownerId: string
): Promise<HotelRecord[]> {
  const { data, error } = await supabaseAdmin
    .from("hotels")
    .select("id, name, slug, description, welcome_message, contact_phone, website, location, owner_id, status")
    .eq("owner_id", ownerId);

  if (error || !data) return [];
  return data as HotelRecord[];
}
