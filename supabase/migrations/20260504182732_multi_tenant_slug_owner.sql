-- Multi-tenant SaaS: add slug, owner_id, status to hotels; add category to documents

-- 1. Hotels: add slug column (NOT NULL with a temp default, then remove default)
ALTER TABLE "hotels" ADD COLUMN "slug" TEXT;
ALTER TABLE "hotels" ADD COLUMN "owner_id" TEXT;
ALTER TABLE "hotels" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';

-- 2. Seed existing hotel with a slug
UPDATE "hotels" SET "slug" = 'taiz-tourist' WHERE "id" = 'taiz-hotel-001';

-- 3. Make slug NOT NULL + UNIQUE after seeding
ALTER TABLE "hotels" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_slug_key" UNIQUE ("slug");

-- 4. Index slug for fast lookups
CREATE INDEX "hotels_slug_idx" ON "hotels" ("slug");

-- 5. Documents: add category column (optional)
ALTER TABLE "documents" ADD COLUMN "category" TEXT;
