-- Phase 4: Add welcome_message to hotels, metadata to chat_messages

ALTER TABLE "hotels" ADD COLUMN IF NOT EXISTS "welcome_message" TEXT;

ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}';
