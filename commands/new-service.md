---
description: Scaffold a service or server boundary the house way — operation contract, zod schema, shared http client, DTO mapping, narrowed Result with ErrorKey
argument-hint: <operation-name> [external system / endpoint]
---

Scaffold a service boundary: $ARGUMENTS

Load the `pxkit-service` skill (and `pxkit-conventions` for structure/testing). Phase 2 is the plan — no code before confirmation.

## 1. Inspect the repo

Find and reuse: `Result<T, K>`, the shared `http` client (`lib/http.ts`), `errorKeyFromResponse` / `errorKeyFromException`, typed `env.ts`, existing services in the same feature. Match location and naming — do not parallel-invent.

## 2. Define the operation contract

**Present before writing code:**

- Operation name, external system (REST, DB, SDK)
- Success type (`null` or domain shape)
- Payload zod schema → `z.infer` type
- Narrowed `ErrorKey` union — reason keys when known, catch-all only when unknown
- Mapper (in the service file, tested next to it) vs schema and pure logic (`lib/`, tested) vs I/O shell

**Wait for confirmation.**

## 3. Build

- **Schema** colocated — same schema can drive form validation later (`pxkit-form`).
- **Service**: goes through the shared `http` client (no raw `fetch`/headers/timeout — the client owns those); DTO mapping stays inside the file; return `Result`, never throw to UI. Raw-SDK services (non-HTTP) keep their own try/catch with `'Error in <fn>::'`.
- **Action/handler** (if needed): thin `'use server'` or route handler — validate, delegate, return plain `Result`.
- **Error keys** added to feature's `constants/error-keys.ts`.
- **Tests** on the mapper (next to the service) and on `lib/` logic — not on fetch wiring.

## 4. Verify

- `Result<T, K>` with `K` narrowed — foreign key is a type error.
- No vendor types escape the service file.
- No `process.env` reads in the service; mappers have tests; typecheck/lint pass.
