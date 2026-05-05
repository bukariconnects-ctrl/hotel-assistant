# System Change Log — Hotel AI Assistant (RAG System)

> **Rule:** This file must be updated after every change made to the project.  
> **Project Path:** `d:\RAG_SYSTEM`  
> **Last Updated:** 2026-05-05 (v1.4.0)

---

## System Overview

| Property | Value |
|---|---|
| **Project Name** | Hotel AI Assistant (RAG-Based) |
| **Purpose** | AI Guest Assistant for hotels using Retrieval-Augmented Generation (RAG) |
| **Framework** | Next.js 14.2.18 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | PostgreSQL via Supabase (`vobhfdqnpuosqwhjdpyx`) |
| **ORM** | Prisma v5.22.0 |
| **AI — Embeddings** | `gemini-embedding-2-preview` (768 dimensions) |
| **AI — Chat** | Gemini 1.5 Pro |
| **Vector Storage** | pgvector extension in Supabase (`vector(768)`) |

---

## Current Project Structure

```
d:\RAG_SYSTEM\
├── app\
│   ├── globals.css          # Tailwind CSS global styles
│   ├── layout.tsx           # Root layout (metadata: "Hotel AI Assistant")
│   └── page.tsx             # Home page (placeholder)
├── lib\
│   ├── prisma.ts            # Prisma client singleton (global cached instance)
│   └── supabase.ts          # Supabase clients: anon + service-role (admin)
├── prisma\
│   ├── schema.prisma        # Prisma schema — 5 models + pgvector extension
│   └── migrations\
│       └── 20250504000000_init\
│           └── migration.sql  # Initial migration SQL (applied ✅)
├── scripts\
│   └── verify-db.ts         # DB connection test script
├── supabase\
│   ├── config.toml          # Supabase CLI local config
│   └── migrations\
│       └── 20250504000000_init.sql  # Mirror of Prisma migration for Supabase CLI
├── .env                     # DB URLs for Prisma CLI (gitignored)
├── .env.local               # All secrets for Next.js runtime (gitignored)
├── .eslintrc.json           # ESLint config (next/core-web-vitals)
├── .gitignore               # Ignores node_modules, .next, .env, .env*.local
├── next.config.ts           # Next.js config (serverComponentsExternalPackages)
├── package.json             # Project manifest & npm scripts
├── postcss.config.mjs       # PostCSS config for Tailwind
├── system_change_log.md     # ← This file
├── tailwind.config.ts       # Tailwind content paths
└── tsconfig.json            # TypeScript config (bundler moduleResolution)
```

---

## Database Schema

### Tables in Supabase (`public` schema)

| Table | Key Columns | Notes |
|---|---|---|
| `hotels` | `id` (cuid), `name`, `description`, `created_at`, `updated_at` | Root entity |
| `documents` | `id`, `hotel_id` (FK→hotels), `file_name`, `file_type`, `file_size`, `storage_path`, `status` (default: `'processing'`) | PDF/file metadata |
| `document_sections` | `id`, `document_id` (FK→documents), `content`, `metadata` (jsonb), `embedding` **vector(768)**, `created_at` | Text chunks + embeddings |
| `chat_sessions` | `id`, `hotel_id` (FK→hotels), `guest_name`, `created_at`, `updated_at` | Per-guest chat sessions |
| `chat_messages` | `id`, `session_id` (FK→chat_sessions), `role`, `content`, `created_at` | Individual messages |

### Extensions & Indexes
- **Extension:** `pgvector` (`CREATE EXTENSION IF NOT EXISTS "vector"`)
- **Index:** `document_sections_embedding_idx` — `USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`
- All FK constraints use `ON DELETE CASCADE`

---

## npm Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Start dev server |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |
| `lint` | `next lint` | Run ESLint |
| `db:generate` | `prisma generate` | Regenerate Prisma client |
| `db:migrate` | `prisma migrate deploy` | Apply pending migrations (production) |
| `db:migrate:dev` | `prisma migrate dev` | Create + apply migrations (development) |
| `db:studio` | `prisma studio` | Open Prisma Studio GUI |

---

## Change History

---

### [v0.1.0] — 2026-05-04 — Initial Project Setup & Database Migration

**Status:** ✅ Complete

#### What was done:

1. **Scaffolded Next.js project manually** (directory name `RAG_SYSTEM` has caps — `create-next-app` rejected it).
   - Created `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`
   - Created `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
   - Created `.eslintrc.json`, `.gitignore`

2. **Installed all project dependencies** via `npm install`:
   - **Runtime:** `next@14.2.18`, `react@^18`, `react-dom@^18`, `@google/generative-ai@^0.21.0`, `@prisma/client@^5.22.0`, `@supabase/supabase-js@^2.45.4`, `ai@^3.4.33`, `pdf-parse@^1.1.1`
   - **Dev:** `prisma@^5.22.0`, `typescript@^5`, `tailwindcss@^3.4.1`, `@types/node`, `@types/react`, `@types/react-dom`, `@types/pdf-parse`, `eslint`, `eslint-config-next`, `dotenv`, `supabase@2.98.0`

3. **Created Prisma schema** (`prisma/schema.prisma`):
   - Generator: `prisma-client-js` with `postgresqlExtensions` preview feature
   - Datasource: `postgresql`, `DATABASE_URL` (pooler), `DIRECT_URL` (direct — for migrations)
   - Extension: `pgvector` mapped to `"vector"`
   - 5 models: `Hotel`, `Document`, `DocumentSection`, `ChatSession`, `ChatMessage`
   - `DocumentSection.embedding` uses `Unsupported("vector(768)")` (Prisma does not natively support the vector type)

4. **Created manual migration SQL** (`prisma/migrations/20250504000000_init/migration.sql`):
   - Wrote raw SQL because Prisma skips `Unsupported` columns in auto-generated migrations
   - Includes: `CREATE EXTENSION`, 5 `CREATE TABLE` statements, `ivfflat` index, 4 FK constraints

5. **Created utility libraries:**
   - `lib/prisma.ts` — global Prisma client singleton (prevents connection exhaustion in dev)
   - `lib/supabase.ts` — exports `supabase` (anon key) and `supabaseAdmin` (service role key)

6. **Created `.env`** (gitignored) — Prisma CLI reads `.env`, not `.env.local`; contains `DATABASE_URL` and `DIRECT_URL`

7. **Ran `npx prisma generate`** — generated Prisma client from schema

8. **Ran `npx prisma migrate deploy`** — applied migration `20250504000000_init` to Supabase via `DIRECT_URL`

9. **Verified database connection** (`scripts/verify-db.ts`):
   - ✅ Connected, count = 0
   - ✅ Insert: created hotel record
   - ✅ Fetch: retrieved same record
   - ✅ Cleanup: deleted test record

10. **Set up Supabase CLI:**
    - Installed `supabase@2.98.0` as local dev dependency (global npm install not supported)
    - Ran `npx supabase init` — created `supabase/config.toml`
    - Created `supabase/migrations/20250504000000_init.sql` (mirror of Prisma migration)
    - Ran `npx supabase link --project-ref vobhfdqnpuosqwhjdpyx` — linked to remote project
    - Ran `npx supabase migration repair --status applied 20250504000000` — marked migration as applied in Supabase's tracker (tables were already live from Prisma)
    - Ran `npx supabase db push` → **"Remote database is up to date."** ✅

#### Known Notes:
- `supabase` CLI must be run via `npx supabase` (local dev dependency)
- Prisma CLI must be run via `npx prisma` and requires `.env` to be present
- Future migrations should be added to BOTH `prisma/migrations/` AND `supabase/migrations/` to keep both trackers in sync
- The `ivfflat` index on `embedding` uses `lists = 100`; this is appropriate for up to ~1M vectors; revisit if data grows significantly

---

### [v0.2.0] — 2026-05-04 — Document Ingestion Pipeline (Admin Side)

**Status:** ✅ Complete

#### What was done:

1. **Created `lib/ai/google-ai.ts`** — Lazy-initialized singleton for `GoogleGenerativeAI` client.
   - Reads `GOOGLE_GENERATIVE_AI_API_KEY` from environment at first call (not at module load — avoids build-time errors)
   - Throws clearly if the key is missing

2. **Created `lib/ai/embedding-service.ts`** — Embedding generation wrapper.
   - `generateEmbedding(text)` — single chunk embedding via `gemini-embedding-2-preview`
   - `generateEmbeddingsBatch(texts[])` — batches in groups of 20 with 200ms delay between batches (rate-limit safe)
   - `formatEmbeddingForPg(embedding)` — formats `number[]` → `"[0.1,0.2,...]"` for PostgreSQL `::vector` cast

3. **Created `lib/ai/text-chunker.ts`** — Smart text chunking with sentence-aware boundaries.
   - Default: 800-char chunks, 150-char overlap
   - Tries to break at sentence endings (`.`, `!`, `?`) or paragraph breaks before hard-cutting
   - Returns `TextChunk[]` with `index`, `startChar`, `endChar` for rich metadata

4. **Created `app/api/admin/documents/upload/route.ts`** — Full PDF ingestion pipeline.
   - Accepts `multipart/form-data` with `file` (PDF) + `hotelId`
   - Validates: file type, hotel existence in DB
   - Creates `documents` record (status: `processing`) before work starts
   - Extracts text with `pdf-parse` via `require("pdf-parse/lib/pdf-parse.js")` (avoids Next.js bundler test-file issue)
   - Chunks text → generates embeddings (batched) → saves `document_sections`
   - **Vector insertion strategy:** Two-step — Prisma `create` (without embedding), then `$executeRaw` UPDATE with `::vector` cast (required for `Unsupported` type)
   - Updates document status → `"ready"` on success, `"error"` on failure
   - `export const maxDuration = 300` (5-min timeout for large PDFs)

5. **Created `app/admin/page.tsx`** — Admin UI for document upload.
   - Dark-themed layout (`bg-gray-950`)
   - Drag-and-drop PDF upload zone with click fallback
   - 4-step pipeline status tracker with animated indicators (pending / active / done / error)
   - Result card showing: chunks embedded, characters processed, document ID
   - Fully disabled during upload, error display on failure

#### Required Action — Add to `.env.local`:
```
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```
Get a key from: https://aistudio.google.com/app/apikey

#### Architecture Notes:
- `pdf-parse` imported via subpath (`pdf-parse/lib/pdf-parse.js`) to avoid Next.js bundler loading its test fixtures
- `runtime = "nodejs"` and `maxDuration = 300` set on the upload route for long-running operations
- Embedding dimension is 768 — matches `vector(768)` column in `document_sections`
- Each `DocumentSection` stores chunk metadata (index, char range, fileName, hotelId) in the `metadata` JSONB column for future retrieval filtering

---

### [v0.3.0] — 2026-05-04 — RAG Retrieval Engine & Guest Chat UI

**Status:** ✅ Complete

#### What was done:

1. **Supabase migration: `20260503224003_add_test_hotel.sql`** — Seeded test hotel.
   - Hotel ID: `taiz-hotel-001`
   - Hotel Name: `فندق تعز السياحي`
   - Uses `ON CONFLICT ("id") DO NOTHING` — idempotent/safe to re-run
   - Applied via `npx supabase db push` ✅

2. **Created `lib/ai/retrieval-service.ts`** — Vector similarity search.
   - `getRelevantContext(query, hotelId, topK=5, threshold=0.25)` — generates query embedding, runs cosine similarity search via `<=>` operator (pgvector), filters by `d.status = 'ready'` and `ds.embedding IS NOT NULL`
   - `buildContextBlock(chunks)` — formats retrieved chunks as numbered `[Source N]` blocks for the system prompt
   - Handles Prisma's `$queryRaw` returning `Decimal` for computed columns via `RawChunk` intermediate type

3. **Created `app/api/chat/route.ts`** — Streaming RAG chat endpoint.
   - Accepts `{ messages: ChatMessage[], hotelId: string }`
   - Validates hotel existence, extracts last user message
   - Calls `getRelevantContext()` then injects results into system prompt
   - System prompt enforces: answer only from context, respond in guest's language, suggest front desk if unknown
   - Uses `model.startChat({ history })` for multi-turn context, streams with `GoogleGenerativeAIStream` + `StreamingTextResponse`
   - `maxDuration = 60`

4. **Created `app/api/hotel/[hotelId]/route.ts`** — Hotel info endpoint.
   - `GET /api/hotel/:id` — returns `{ id, name, description }`
   - Used by chat UI to display hotel name in header

5. **Created `app/chat/[hotelId]/page.tsx`** — Guest chat UI.
   - `useChat` hook from `ai/react` with `body: { hotelId }` injected on every request
   - Dark-themed (`bg-slate-950`), fully mobile-responsive
   - Empty state with 3 quick-reply suggestion chips
   - Animated message bubbles (fade-in CSS keyframe) with user (indigo) / AI (slate) distinction
   - Animated typing indicator (3-dot bounce animation) during streaming
   - AI avatar badge in header with hotel name + "Online" status
   - Scrolls to bottom on each new message

#### Guest Chat URL
```
http://localhost:3000/chat/taiz-hotel-001
```

#### Full RAG Pipeline (End-to-End)
```
Guest question
  → generateEmbedding(query)           [gemini-embedding-2-preview]
  → pgvector <=> cosine search         [top 5 chunks, threshold ≥ 0.25]
  → buildContextBlock()                [format as [Source N] blocks]
  → Gemini 1.5 Pro systemInstruction  [hotel-scoped system prompt]
  → model.startChat + sendMessageStream
  → GoogleGenerativeAIStream           [streamed back to client]
  → useChat renders tokens as they arrive
```

---

### [v0.3.1] — 2026-05-04 — Hotfix: next.config.ts → next.config.mjs

**Status:** ✅ Fixed

#### Root Cause
Next.js 14.x does **not** support TypeScript config files (`next.config.ts`). That feature was introduced in Next.js 15. The dev server threw on startup:
```
Error: Configuring Next.js via 'next.config.ts' is not supported.
Please replace the file with 'next.config.js' or 'next.config.mjs'.
```

#### Fix
- Deleted `next.config.ts`
- Created `next.config.mjs` with identical config using JSDoc type annotation instead of TypeScript
- Dev server now starts cleanly: `✓ Ready in 2.8s` at `http://localhost:3000`

---

### [v0.3.2] — 2026-05-04 — Hotfix: Embedding Dimension 768 → 3072

**Status:** ✅ Fixed

#### Root Cause
`gemini-embedding-2-preview` outputs **3072-dimensional** vectors, not 768. The original schema assumed 768 (matching older Gemini embedding models), causing a pgvector dimension mismatch on every insert:
```
ERROR: expected 768 dimensions, not 3072 (SQLSTATE 22000)
```

#### Changes Made
- **`prisma/schema.prisma`** — `Unsupported("vector(768)")` → `Unsupported("vector(3072)")`
- **`supabase/migrations/20260503230428_update_vector_dimension.sql`** — Migration that:
  1. Drops the old `ivfflat` index on `document_sections.embedding`
  2. `ALTER TABLE ... ALTER COLUMN "embedding" TYPE vector(3072)`
  3. No index recreated (see note below)
- **`npx prisma generate`** — Prisma client regenerated against updated schema
- **`npx supabase db push`** — Migration applied ✅

#### Index Note
pgvector's **IVFFlat and HNSW indexes both have a hard 2000-dimension limit**. 3072 exceeds this, so the index was dropped and not recreated. The `<=>` cosine operator still works via sequential scan — acceptable for development/testing with small datasets. For production, options are:
- Reduce embedding dimensions (e.g., use `text-embedding-004` at 768 dims)
- Upgrade to a pgvector build that lifts the HNSW dimension cap

---

### [v0.3.3] — 2026-05-04 — Hotfix: Connection Pool Timeout + Dimension Stabilization

**Status:** ✅ Fixed

#### Issues Fixed

**1. Prisma Connection Pool Timeout**
Error: `Timed out fetching a new connection from the connection pool (connection limit: 9)`
- **Cause:** Hot-reload in dev spawned multiple PrismaClient instances despite the singleton, each claiming pool connections from the pgBouncer limit.
- **Fix in `lib/prisma.ts`:** Removed `log: ["query"]` (creates extra overhead), added `buildDatabaseUrl()` helper that appends `&connection_limit=1` to `DATABASE_URL` at runtime, keeping the pool to a single connection per process.

**2. Embedding Dimension Stabilization (3072 → 768)**
Error: dimension mismatch between Gemini output and DB column.
- **Decision:** Use `outputDimensionality: 768` on `gemini-embedding-2-preview` (the model supports flexible output dims). This is more efficient (4× less storage) and allows IVFFlat indexing (≤2000 dim limit).
- **Fix in `lib/ai/embedding-service.ts`:** Changed `embedContent(text)` → `embedContent({ content: { parts: [{ text }], role: "user" }, outputDimensionality: 768 })`. Used `as any` cast since `@google/generative-ai@0.21.0` doesn't yet type this property (it is valid at REST API level).
- **Fix in `prisma/schema.prisma`:** Reverted `vector(3072)` → `vector(768)`.
- **New migration `20260503231816_revert_vector_dimension_to_768.sql`:**
  - `ALTER TABLE "document_sections" ALTER COLUMN "embedding" TYPE vector(768)`
  - Recreated IVFFlat index (`vector_cosine_ops`, `lists=100`) — now possible again since 768 ≤ 2000

**3. Prisma Client Regenerated**
- `npx prisma generate` run after schema revert ✅
- `npx supabase db push` applied migration ✅

#### Final State
- DB column: `vector(768)` with IVFFlat index restored
- Gemini output: 768 dims (forced via `outputDimensionality`)
- Prisma pool: capped at 1 connection (`connection_limit=1` appended at runtime)
- Dev server: running at `http://localhost:3000`

---

### [v0.4.0] — 2026-05-04 — Strategic Refactor: Upload Pipeline → supabaseAdmin

**Status:** ✅ Complete

#### Strategic Decision
Replaced Prisma with `supabaseAdmin` (REST/PostgREST via `@supabase/supabase-js`) for all database operations in the upload pipeline. This eliminates the connection pool bottleneck entirely — `supabaseAdmin` uses HTTP, not a persistent TCP connection pool.

#### Changes Made

**1. `app/api/admin/documents/upload/route.ts` — Full Rewrite**
- Removed all `prisma` imports; now uses `supabaseAdmin` from `lib/supabase.ts`
- Hotel lookup: `supabaseAdmin.from("hotels").select().eq("id", hotelId).single()`
- Document insert: `supabaseAdmin.from("documents").insert({...}).select("id").single()`
- Section inserts: batched in groups of 50 (`SECTION_INSERT_BATCH = 50`) via `supabaseAdmin.from("document_sections").insert(batch)`
- Embeddings passed as `number[]` arrays directly — PostgREST/pgvector casts them automatically
- Status updates: `supabaseAdmin.from("documents").update({ status }).eq("id", id)`
- Helper `setDocumentStatus()` extracted to reduce repetition
- Full error propagation with status set to `"error"` on any failure

**2. `lib/ai/embedding-service.ts`**
- Removed `outputDimensionality: 768` — model now returns its natural 3072-dim output

**3. `prisma/schema.prisma`**
- `vector(768)` → `vector(3072)` (kept in sync with DB)

**4. Migration `20260503232246_upgrade_vector_to_3072.sql`**
- Drops IVFFlat index (incompatible with >2000 dims)
- `ALTER TABLE "document_sections" ALTER COLUMN "embedding" TYPE vector(3072)`
- Applied via `npx supabase db push` ✅

**5. `npx prisma generate`** — Client regenerated ✅

#### Architecture After This Change
| Operation | Client | Reason |
|---|---|---|
| Upload pipeline (insert) | `supabaseAdmin` | No connection pool, HTTP-based |
| Chat retrieval (vector search) | Prisma `$queryRaw` | Raw SQL needed for `<=>` operator |
| Hotel info API | Prisma | Simple read, singleton handles it |

---

### [v0.4.1] — 2026-05-04 — Hotfix: Hotel API Pool Timeout + NULL id on Insert

**Status:** ✅ Fixed

#### Bug 1 — `app/api/hotel/[hotelId]/route.ts`: Prisma pool timeout
- **Error:** `PrismaClientInitializationError: Timed out fetching a new connection (connection limit: 1)`
- **Root cause:** Route was still using Prisma after the v0.4.0 supabaseAdmin migration.
- **Fix:** Replaced `prisma.hotel.findUnique()` with `supabaseAdmin.from("hotels").select().eq().single()`.

#### Bug 2 — `app/api/admin/documents/upload/route.ts`: NULL id on insert
- **Error:** `null value in column "id" of relation "documents" violates not-null constraint`
- **Root cause:** The PostgreSQL tables (`documents`, `document_sections`) have `id TEXT NOT NULL` with **no database DEFAULT**. Prisma generates CUIDs on the client side; when bypassed with `supabaseAdmin`, no id is produced.
- **Fix:** Added `id: crypto.randomUUID()` to both insert payloads:
  - `documents` insert
  - Every `document_sections` row in `allSections.map()`
- `crypto.randomUUID()` is built into Node.js 14.17+ — no extra dependency needed.

---

### [v0.4.2] — 2026-05-04 — Hotfix: updated_at NOT NULL Constraint

**Status:** ✅ Fixed

#### Root Cause
Prisma's `@updatedAt` decorator auto-populates `updated_at` on every write. The PostgreSQL column was created as `NOT NULL` with **no DEFAULT** (Prisma managed it). When bypassing Prisma via `supabaseAdmin`, no value was provided, causing:
```
null value in column "updated_at" of relation "documents" violates not-null constraint
```

#### Changes Made

**1. Migration `20260503233425_add_timestamp_defaults.sql`** — Applied ✅
- `ALTER COLUMN "updated_at" SET DEFAULT now()` on `hotels`, `documents`, `chat_sessions`
- `ALTER COLUMN "created_at" SET DEFAULT now()` on all five tables (safety net)
- Now all timestamp columns have DB-level defaults; no insert can fail on missing timestamps

**2. `app/api/admin/documents/upload/route.ts`**
- Added `created_at: now` and `updated_at: now` (where `now = new Date().toISOString()`) to the `documents` insert
- Explicit timestamps in code + DB defaults = double safety

---

### [v0.5.0] — 2026-05-04 — Migrate Chat & Retrieval from Prisma → supabaseAdmin

**Status:** ✅ Complete

#### Strategic Decision
Eliminate all Prisma calls from the real-time chat path. The chat route and retrieval service now use `supabaseAdmin` exclusively — zero Prisma connections during chat, zero pool timeouts.

#### Changes Made

**1. Migration `20260503234327_add_match_documents_function.sql`** — Applied ✅
```sql
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(3072),
  match_threshold float,
  match_count     int,
  p_hotel_id      text
) RETURNS TABLE (id text, content text, metadata jsonb, similarity float)
```
- Performs cosine similarity search via `<=>` operator
- Filters by `hotel_id`, `status = 'ready'`, `embedding IS NOT NULL`, and `threshold`
- Called via `supabaseAdmin.rpc('match_documents', { ... })`

**2. `lib/ai/retrieval-service.ts`** — Full rewrite
- Removed `prisma` and `formatEmbeddingForPg` imports
- Replaced `prisma.$queryRaw` with `supabaseAdmin.rpc('match_documents', { query_embedding, match_threshold, match_count, p_hotel_id })`
- Passes `queryEmbedding` as `number[]` — PostgREST casts to `vector(3072)` automatically
- Errors return `[]` gracefully (non-fatal for chat)

**3. `app/api/chat/route.ts`**
- Swapped `import { prisma }` → `import { supabaseAdmin }`
- `prisma.hotel.findUnique()` → `supabaseAdmin.from("hotels").select("id, name").eq().single()`
- Zero Prisma usage in the chat path

**4. `lib/prisma.ts`**
- `connection_limit` raised from `1` → `5` (Prisma Studio / dev tools no longer freeze)

#### Architecture — Final State
| Route / Service | DB Client | Reason |
|---|---|---|
| `POST /api/admin/documents/upload` | `supabaseAdmin` | Bulk inserts, no pool |
| `GET /api/hotel/[hotelId]` | `supabaseAdmin` | Simple read, no pool |
| `POST /api/chat` (hotel lookup) | `supabaseAdmin` | No pool |
| `lib/ai/retrieval-service` (vector search) | `supabaseAdmin.rpc` | No pool |
| Prisma | Kept for Studio / schema sync | Pool limit: 5 |

---

### [v0.6.0] — 2026-05-04 — Direct REST Embedding + Gemini 2.0 Flash Chat

**Status:** ✅ Complete

#### Problem
`gemini-1.5-pro` returned HTTP 404 (`models/gemini-1.5-pro is not found for API version v1beta`). Additionally the SDK did not correctly type `outputDimensionality`, leaving embedding dimension control unreliable.

#### Changes Made

**1. `lib/ai/embedding-service.ts` — Full rewrite (SDK removed)**
- Replaced `@google/generative-ai` SDK with a direct `fetch` call to:
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2-preview:embedContent`
- Body includes `outputDimensionality: 768` — MRL-scaling guaranteed at REST level
- Uses `GOOGLE_GENERATIVE_AI_API_KEY` env var
- `formatEmbeddingForPg` kept for backward compat
- Batch delay increased to 300ms for rate-limit headroom

**2. `app/api/chat/route.ts` — Upgraded models + fallback**
- Primary model: `gemini-2.0-flash`
- Fallback model: `gemini-2.0-flash-lite` (auto-triggered on 404 / 429 / 503 / RESOURCE_EXHAUSTED)
- `callGeminiWithFallback()` helper iterates `CHAT_MODELS` array; logs which model served the request
- `isFallbackableError()` regex checks error message for retryable conditions
- Stricter system prompt: "Answer ONLY from context"

**3. Migration `20260504131848_finalize_768_dimensions_and_models.sql`** — Applied ✅
- `UPDATE document_sections SET embedding = NULL` — clears incompatible 3072-dim vectors
- `UPDATE documents SET status = 'pending'` — flags docs for re-ingestion
- `ALTER COLUMN embedding TYPE vector(768)` — reverts to 768 dims
- Recreates IVFFlat index (768 ≤ 2000 — fast ANN search restored)
- `CREATE OR REPLACE FUNCTION match_documents(query_embedding vector(768), ...)` — updated signature

**4. `prisma/schema.prisma`** — Synced to `vector(768)`

**5. `npx prisma generate`** — Client regenerated ✅

#### Action Required
> **Re-upload all PDFs** at `/admin` — existing embeddings were cleared (dimension change from 3072 → 768). Documents are marked `pending`.

---

### [v0.6.1] — 2026-05-04 — Quota Fallback Chain + Arabic UI Error

**Status:** ✅ Complete

#### Problem
Both `gemini-2.0-flash` and `gemini-2.0-flash-lite` hit free-tier quota simultaneously (429 × 2), exhausting the 2-model fallback chain. All failures threw `500 Internal Server Error` with a generic UI message.

#### Changes Made

**1. `app/api/chat/route.ts`**
- `CHAT_MODELS` expanded to 4 entries:
  ```
  gemini-2.0-flash → gemini-2.0-flash-lite → gemini-1.5-flash → gemini-1.5-flash-8b
  ```
- Added `AllModelsQuotaExceededError` class — thrown when **every** model fails with a quota/429 signal
- `allFailuresAreQuota` flag tracks whether all failures were quota-related vs other errors
- When `AllModelsQuotaExceededError` is caught in the POST handler, returns:
  ```json
  { "error": "QUOTA_EXCEEDED", "message": "تجاوزت حد الطلبات المجانية، يرجى المحاولة بعد قليل." }
  ```
  with `status: 429` (not 500)
- Terminal log now shows per-model failure reason: `(quota)` vs `(error)`

**2. `app/chat/[hotelId]/page.tsx`**
- Error banner now distinguishes quota vs generic errors:
  - **Quota:** amber banner + `⏳ تجاوزت حد الطلبات المجانية، يرجى المحاولة بعد قليل.`
  - **Other:** red banner + `Something went wrong. Please try again.`
- Detection: `error.message.includes("QUOTA_EXCEEDED")` — works because the AI SDK sets `error.message = responseBodyText`

---

### [v0.6.2] — 2026-05-04 — New API Key + Model List Fix

**Status:** ✅ Complete

#### Problem
- Old `GOOGLE_GENERATIVE_AI_API_KEY` had exhausted its free-tier quota for all models.
- `gemini-1.5-flash-8b` returns `404 Not Found` for API version `v1beta` — the SDK uses v1beta by default, so this model is not usable in the current setup.

#### Changes Made

**1. `.env.local`**
- Replaced `GOOGLE_GENERATIVE_AI_API_KEY` with a fresh key (new quota pool).

**2. `app/api/chat/route.ts`**
- Removed `gemini-1.5-flash-8b` from `CHAT_MODELS` (not in v1beta).
- Replaced with `gemini-1.5-pro` (available in v1beta, separate quota pool).
- Final fallback chain:
  ```
  gemini-2.0-flash → gemini-2.0-flash-lite → gemini-1.5-flash → gemini-1.5-pro
  ```

**3. Dev server restarted** — required to load new env var and reset the `GoogleGenerativeAI` singleton.

---

### [v0.6.3] — 2026-05-04 — Switch Chat Models to Gemini 2.5

**Status:** ✅ Complete

#### Problem
All 4 previous fallback models were unavailable:
- `gemini-2.0-flash` / `gemini-2.0-flash-lite` — 429 quota exhausted
- `gemini-1.5-flash` / `gemini-1.5-pro` — 404 not found in v1beta

#### Changes Made

**`app/api/chat/route.ts`**
- `CHAT_MODELS` replaced with:
  ```
  gemini-2.5-flash (primary) → gemini-2.5-flash-lite (fallback)
  ```
- These are the latest Gemini models with separate quota pools from 2.0/1.5

---

### [v1.0.0] — 2026-05-04 — Phase 1: Multi-Tenant SaaS Foundation

**Status:** ✅ Complete (DB + Auth + Slug Logic)

#### Overview
Transformed the system from a single-hotel app into a multi-tenant SaaS with auth, slugs, and data isolation.

#### Changes Made

**1. `prisma/schema.prisma` — Schema Update**
- `Hotel` model: added `slug` (String, @unique), `ownerId` (String?, maps to `owner_id`), `status` (String, default: `"active"`)
- `Document` model: added `category` (String?, optional) for file classification

**2. Migration `20260504182732_multi_tenant_slug_owner.sql`** — Applied ✅
- `ALTER TABLE hotels ADD COLUMN slug TEXT` + `owner_id TEXT` + `status TEXT DEFAULT 'active'`
- Seeded existing `taiz-hotel-001` with `slug = 'taiz-tourist'`
- `ALTER COLUMN slug SET NOT NULL` + `UNIQUE` constraint + index
- `ALTER TABLE documents ADD COLUMN category TEXT`

**3. `lib/hotel-service.ts`** — New utility
- `getHotelBySlug(slug)` — returns active hotel by URL slug
- `getHotelById(hotelId)` — returns hotel by ID
- `getHotelsByOwner(ownerId)` — returns all hotels for a manager

**4. `lib/supabase-server.ts`** — New: Server-side Supabase client
- Uses `@supabase/ssr` + `cookies()` for Next.js server components
- `getSession()` and `getUser()` helpers

**5. `middleware.ts`** — New: Auth middleware
- Protects `/admin/*` routes — redirects unauthenticated users to `/login`
- Protects `/api/admin/*` routes — returns `401 Unauthorized`
- Refreshes Supabase auth token on every request
- Matcher: `["/admin/:path*", "/api/admin/:path*"]`

**6. `app/api/hotel/by-slug/[slug]/route.ts`** — New: Slug-based hotel API
- `GET /api/hotel/by-slug/:slug` — returns hotel data by slug

**7. `app/api/hotel/[hotelId]/route.ts`** — Updated
- Now returns `slug` field in response

**8. `app/api/chat/route.ts`** — Updated
- Accepts `{ slug }` OR `{ hotelId }` in request body
- Resolves slug → hotelId internally before RAG lookup

**9. `@supabase/ssr`** — Installed as dependency

#### Architecture
| Feature | Implementation |
|---|---|
| Hotel identity | `slug` (URL-friendly, unique, indexed) |
| Ownership | `owner_id` column → Supabase Auth user ID |
| Data isolation | All queries filter by `hotel_id` |
| Auth | Supabase Email/Password via `@supabase/ssr` middleware |
| Admin protection | Middleware redirects to `/login` |
| Guest chat URL | `/chat/:slug` (future) or `/chat/:hotelId` (current) |

---

### [v1.1.0] — 2026-05-04 — Phase 2: Public Pages, Auth UI & Onboarding

**Status:** ✅ Complete

#### Overview
Built all public-facing pages, authentication UI, hotel manager onboarding, and refactored the admin dashboard for multi-tenant ownership.

#### New Pages & Routes

| Route | Type | Description |
|---|---|---|
| `/` | Landing | Hero, Features (6), Pricing (3 tiers), CTAs, Footer. framer-motion animations. |
| `/login` | Auth | Email/Password sign-in via Supabase, redirect support |
| `/register` | Auth | Email/Password sign-up, redirects to `/admin/onboarding` |
| `/admin/onboarding` | Protected | Hotel creation: name, slug (validated), description. Links to `owner_id`. |
| `/admin` | Protected | Auto-fetches owner’s hotel. No hotel → redirect to onboarding. Sign out button. |
| `/hotels` | Public | Directory of all active hotels with card UI + "Chat with AI" links |

#### New API Routes

| Route | Method | Description |
|---|---|---|
| `POST /api/admin/hotels` | Protected | Create hotel (validates slug uniqueness, links owner_id) |
| `GET /api/admin/hotels` | Protected | List hotels for authenticated user |
| `GET /api/hotels` | Public | List all active hotels |

#### Key Implementation Details

**Auth pages** (`app/(auth)/login` & `app/(auth)/register`)
- Client-side Supabase auth with `createClient`
- Login supports `?redirect=` query param
- Register redirects to `/admin/onboarding`

**Onboarding** (`app/admin/onboarding`)
- Slug validation: lowercase, alphanumeric, hyphens only
- Auto-generates slug from hotel name
- Uniqueness check via `/api/admin/hotels` POST
- Preview: shows `/chat/{slug}` URL

**Admin Dashboard** (refactored `app/admin/page.tsx`)
- Fetches `GET /api/admin/hotels` on mount
- If 401 → redirect to `/login`
- If no hotels → redirect to `/admin/onboarding`
- Header shows hotel name + slug, "Open Chat" + "Sign Out" buttons
- Removed manual Hotel ID input — auto-uses owner’s hotel

**Landing Page** (`app/page.tsx`)
- Sticky nav with Sign In / Register / Browse Hotels
- Hero with gradient text + dual CTAs
- 6 feature cards (AI, Multilingual, Setup, Isolation, RAG, Multi-Hotel)
- 3 pricing tiers (Free / Pro / Enterprise)
- Final CTA + footer
- `framer-motion` fade-up animations throughout

**Hotel Directory** (`app/hotels/page.tsx`)
- Fetches `GET /api/hotels` (public, no auth)
- Card grid with hotel name, description, slug
- Each card links to `/chat/{slug}`
- Empty state with registration CTA

#### Dependencies Added
- `framer-motion` — entrance animations on landing page and directory

---

### [v1.2.0] — 2026-05-04 — Phase 3: Knowledge Base Management & Slug-Based Chat

**Status:** ✅ Complete

#### Overview
Built a professional document management dashboard for hotel owners with a Knowledge Base table, category support, delete/toggle actions, and confirmation dialogs. Migrated guest chat from `hotelId`-based to `slug`-based routing. Added shared global navigation with auth-aware Dashboard/Logout links.

#### Admin Dashboard Rewrite (`app/admin/page.tsx`)
- **Upload form** now includes a **Category dropdown** (Policy, Menu, Services, Guide, General)
- **Knowledge Base table** with columns: File (icon + name + size), Category, Upload Date, Status badge, Actions (Toggle, Delete)
- **Loading skeleton** while documents are being fetched
- **Empty state** when no documents exist
- **Status toggle** — switch documents between `ready` (Active) and `inactive` via PATCH
- **Delete with confirmation dialog** — modal with file name preview, cancel/confirm buttons, loading state
- Uses `lucide-react` icons throughout (FileText, Trash2, ToggleLeft/Right, Upload, Loader2, etc.)
- Sticky header with Dashboard, Open Chat, Sign Out nav buttons

#### New API Routes

| Route | Method | Description |
|---|---|---|
| `GET /api/admin/documents?hotelId=` | Protected | List all documents for a hotel (with ownership verification) |
| `DELETE /api/admin/documents/[id]` | Protected | Delete document + all linked sections (ownership verified) |
| `PATCH /api/admin/documents/[id]` | Protected | Toggle document status between `ready` and `inactive` |

#### Upload Route Update (`app/api/admin/documents/upload/route.ts`)
- Now accepts `category` from FormData and stores it in the `documents` table
- Defaults to `"General"` if not provided

#### Slug-Based Chat Route
- **Deleted** `app/chat/[hotelId]/page.tsx`
- **Created** `app/chat/[slug]/page.tsx`
  - Fetches hotel data via `GET /api/hotel/by-slug/{slug}`
  - Passes `{ slug }` to the chat API instead of `{ hotelId }`
  - Shows 404 page with "Browse Hotels" link if slug not found
  - Added "Directory" link in chat header

#### Chat Logic Verification
- `match_documents` RPC already filters `d.status = 'ready'` — inactive documents are automatically excluded from retrieval
- System prompt already dynamically includes `hotel.name`
- Chat API already accepts both `slug` and `hotelId` (slug takes priority)

#### Shared NavBar Component (`components/nav-bar.tsx`)
- Detects auth state via `supabase.auth.getUser()`
- **Logged in**: Shows Dashboard + Logout buttons
- **Logged out**: Shows Sign In + Register links
- Always shows "Browse Hotels" link
- Used on Landing Page (`/`) and Hotel Directory (`/hotels`)

#### Dependencies Added
- `lucide-react` — icons for the admin dashboard table and navigation

#### Files Created
- `components/nav-bar.tsx`
- `app/api/admin/documents/route.ts`
- `app/api/admin/documents/[id]/route.ts`
- `app/chat/[slug]/page.tsx`

#### Files Modified
- `app/admin/page.tsx` — full dashboard rewrite
- `app/api/admin/documents/upload/route.ts` — category field support
- `app/page.tsx` — uses shared NavBar
- `app/hotels/page.tsx` — uses shared NavBar

#### Files Deleted
- `app/chat/[hotelId]/page.tsx` — replaced by slug-based route

---

### [v1.3.0] — 2026-05-04 — Phase 4: Hotel Personalization, Analytics & AI Citations

**Status:** ✅ Complete

#### Overview
Added hotel personalization (custom welcome message), dashboard analytics cards, and AI citations that show document source file names as badges in the guest chat.

#### Schema Changes
- **`hotels`** table: added `welcome_message` column (TEXT, nullable)
- **`chat_messages`** table: added `metadata` column (JSONB, default `{}`)
- **`match_documents` RPC**: updated return type to include `file_name` from joined `documents` table (required DROP + CREATE since return type changed)

#### Migrations Applied
- `20260504221800_welcome_message_and_chat_metadata.sql`
- `20260504221900_match_documents_with_filename.sql`

#### Prisma Schema (`prisma/schema.prisma`)
- `Hotel` model: added `welcomeMessage String? @map("welcome_message")`
- `ChatMessage` model: added `metadata Json? @default("{}")`

#### Admin Settings Page (`app/admin/settings/page.tsx`) — NEW
- Protected settings form for hotel owners
- Fields: Hotel Name, Description, AI Welcome Message, Slug (read-only)
- PATCH request to `/api/admin/hotels` with ownership verification
- Success/error toast notifications
- Header with Dashboard, Open Chat, Sign Out nav links

#### Hotels API Update (`app/api/admin/hotels/route.ts`)
- **PATCH handler**: Updates `name`, `description`, `welcome_message` with ownership check
- **GET handler**: Now returns `welcome_message` in the select query

#### Dashboard Analytics (`app/admin/page.tsx`)
- Added "Stats Overview" section with 3 cards at the top of the dashboard:
  - **Total Documents** (indigo icon)
  - **Total Sections/Chunks** (emerald icon)
  - **Chat Sessions** (amber icon)
- Cards show loading skeleton while fetching, then display formatted counts
- Stats fetched from `GET /api/admin/stats?hotelId=`
- Added **Settings** link in dashboard header

#### Stats API (`app/api/admin/stats/route.ts`) — NEW
- Protected route with ownership verification
- Uses `Promise.all` to fetch 3 counts in parallel:
  - `documents` count by `hotel_id`
  - `document_sections` count via document ID sub-select
  - `chat_sessions` count by `hotel_id`

#### AI Citations Logic
- **`match_documents` RPC** now returns `d.file_name` alongside chunk data
- **`lib/ai/retrieval-service.ts`**:
  - `RetrievedChunk` interface: added `file_name?: string`
  - `buildContextBlock()`: includes `(from: filename.pdf)` annotation per source
  - New `getUniqueSourceFiles()` helper: deduplicates file names from chunks
- **`app/api/chat/route.ts`**:
  - System prompt updated with rule 6: instructs Gemini to append `[Sources: file1.pdf, file2.pdf]` at end of response
  - Hotel query now selects `welcome_message`

#### Chat UI Enhancements (`app/chat/[slug]/page.tsx`)
- **Custom welcome message**: Uses `hotel.welcome_message` if set, falls back to default Arabic greeting
- **Citation badges**: `parseSources()` extracts `[Sources: ...]` from AI response end
  - Renders as small indigo badges with file icon below the message body
  - Separated by a subtle border line

#### Hotel Service Update (`lib/hotel-service.ts`)
- `HotelRecord` interface: added `welcome_message: string | null`
- All select queries (`getHotelBySlug`, `getHotelById`, `getHotelsByOwner`) updated to include `welcome_message`

#### Files Created
- `app/admin/settings/page.tsx`
- `app/api/admin/stats/route.ts`
- `supabase/migrations/20260504221800_welcome_message_and_chat_metadata.sql`
- `supabase/migrations/20260504221900_match_documents_with_filename.sql`

#### Files Modified
- `prisma/schema.prisma` — added `welcomeMessage` and `metadata` fields
- `app/api/admin/hotels/route.ts` — PATCH handler + welcome_message in GET
- `app/admin/page.tsx` — stats cards, Settings link, new icons
- `app/api/chat/route.ts` — citations in system prompt
- `lib/ai/retrieval-service.ts` — file_name in chunks, source helpers
- `lib/hotel-service.ts` — welcome_message in all queries
- `app/chat/[slug]/page.tsx` — custom welcome, citation badges

---

### [v1.3.1] — 2026-05-04 — Hotfix: Auth Cookie Sync & Auto-Confirm Registration

**Status:** ✅ Complete

#### Root Causes Fixed
1. **Login redirect hangs forever**: All client-side files used `createClient` from `@supabase/supabase-js` which stores auth tokens in **localStorage**. The middleware uses `@supabase/ssr` which reads **cookies**. The middleware never saw the session → redirected back to `/login` → infinite loop.
2. **Registration required email confirmation**: `supabase.auth.signUp()` sends a confirmation email by default (Supabase project setting). Users had to verify before signing in.

#### Fixes
- **Created `lib/supabase-browser.ts`**: Shared browser Supabase client using `createBrowserClient` from `@supabase/ssr`. This ensures auth tokens are stored in cookies that the middleware can read.
- **Created `app/api/auth/register/route.ts`**: Server-side registration using `supabaseAdmin.auth.admin.createUser()` with `email_confirm: true`. No email verification required.
- **Updated register page** (`app/(auth)/register/page.tsx`): Calls the new API route to create the user, then immediately signs in via `supabase.auth.signInWithPassword()` to set cookies.
- **Updated login page** (`app/(auth)/login/page.tsx`): Switched to `getSupabaseBrowserClient()`.
- **Updated nav-bar** (`components/nav-bar.tsx`): Switched to `getSupabaseBrowserClient()`.
- **Updated admin dashboard** (`app/admin/page.tsx`): Switched to `getSupabaseBrowserClient()`.
- **Updated admin settings** (`app/admin/settings/page.tsx`): Switched to `getSupabaseBrowserClient()`.

#### Deleted
- `app/chat/[hotelId]/` — stale directory causing Next.js route conflict (`'slug' !== 'hotelId'`)

#### Files Created
- `lib/supabase-browser.ts`
- `app/api/auth/register/route.ts`

#### Files Modified
- `app/(auth)/register/page.tsx`
- `app/(auth)/login/page.tsx`
- `components/nav-bar.tsx`
- `app/admin/page.tsx`
- `app/admin/settings/page.tsx`

---

### [v1.4.0] — 2026-05-05 — Phase 5: Chat Monitoring, Insights & Knowledge Improvement

**Status:** ✅ Complete

#### Overview
Added chat message persistence, a Chat History management page for hotel owners, Gemini-powered guest insights, dashboard activity widgets, and enhanced settings with contact fields.

#### Chat Message Persistence (`app/api/chat/route.ts`)
- Creates a new `chat_session` on first message, reuses it for subsequent messages via `sessionId`
- Saves user message to `chat_messages` before streaming
- Uses `stream.tee()` to capture AI response in background and save to `chat_messages` after streaming completes
- Returns `x-session-id` header so the client can track the session
- Chat page (`app/chat/[slug]/page.tsx`) updated to track and send `sessionId` via `useRef` + `onResponse` callback

#### Chat History Page (`app/admin/chats/page.tsx`) — NEW
- Lists all chat sessions with: Guest Name, Start Date, Last Activity, Message Count
- Search functionality to filter by guest name
- "View" button opens a full conversation transcript modal
- Modal shows messages in chat bubble format with User/Bot icons
- Protected: verifies hotel ownership

#### Chat APIs
- **`GET /api/admin/chats?hotelId=`** — Lists sessions with message count (uses Supabase nested count)
- **`GET /api/admin/chats/[id]`** — Returns full message transcript for a session (with ownership verification)

#### Insights API (`app/api/admin/stats/insights/route.ts`) — NEW
- Fetches last 50 user messages for the hotel
- Uses Gemini (`gemini-2.5-flash-lite`) to identify top 3 topics and generate a summary
- Returns `{ topics: string[], summary: string, totalAnalyzed: number }`
- Graceful fallback if too few messages or Gemini unavailable

#### Dashboard Updates (`app/admin/page.tsx`)
- **Recent Activity** card: Shows last 5 chat sessions with guest name, timestamp, message count
- **Guest Insights** card: Shows topic badges + summary from the Insights API
- **Chats** link added to header navigation
- New state: `recentSessions`, `insights` with dedicated fetch callbacks

#### Settings Enhancements
- **Schema**: Added `contact_phone`, `website`, `location` columns to `hotels` table
- **Migration**: `20260505001000_hotel_contact_fields.sql`
- **Prisma**: Added `contactPhone`, `website`, `location` to Hotel model
- **Settings page** (`app/admin/settings/page.tsx`): 3 new form fields (Contact Phone, Website, Location)
- **Hotels API** PATCH/GET: Updated to handle and return new fields
- **Hotel service** (`lib/hotel-service.ts`): Updated `HotelRecord` interface and all select queries

#### Files Created
- `app/admin/chats/page.tsx`
- `app/api/admin/chats/route.ts`
- `app/api/admin/chats/[id]/route.ts`
- `app/api/admin/stats/insights/route.ts`
- `supabase/migrations/20260505001000_hotel_contact_fields.sql`

#### Files Modified
- `prisma/schema.prisma` — added contactPhone, website, location to Hotel
- `app/api/chat/route.ts` — full message persistence (session + user + AI messages)
- `app/chat/[slug]/page.tsx` — sessionId tracking via useRef + onResponse
- `app/admin/page.tsx` — Recent Activity + Insights widgets, Chats nav link
- `app/admin/settings/page.tsx` — Contact Phone, Website, Location fields
- `app/api/admin/hotels/route.ts` — new fields in PATCH/GET
- `lib/hotel-service.ts` — new fields in HotelRecord and all queries

---

*End of log.*
