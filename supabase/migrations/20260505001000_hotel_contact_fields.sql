-- Phase 5: Add contact_phone, website, location to hotels

ALTER TABLE "hotels" ADD COLUMN IF NOT EXISTS "contact_phone" TEXT;
ALTER TABLE "hotels" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "hotels" ADD COLUMN IF NOT EXISTS "location" TEXT;
