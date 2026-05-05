-- Add DEFAULT now() to all updated_at columns that are missing it
-- (created_at already has DEFAULT CURRENT_TIMESTAMP from the init migration)

ALTER TABLE "hotels"
  ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "documents"
  ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "chat_sessions"
  ALTER COLUMN "updated_at" SET DEFAULT now();

-- Also add DEFAULT now() to created_at columns that may be missing it (safety net)
ALTER TABLE "hotels"
  ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "documents"
  ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "document_sections"
  ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "chat_sessions"
  ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "chat_messages"
  ALTER COLUMN "created_at" SET DEFAULT now();
