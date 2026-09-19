---
name: pxkit-service
description: Scaffold a service or server boundary the pxkit way — one shared http client, zod-validated payloads, DTO mapping to domain types, a narrowed Result with SCREAMING_SNAKE ErrorKeys, and no throws to the UI. Use whenever the user asks to call an API, fetch or submit data, add a server action, route handler, webhook, database query, or integrate a vendor SDK (Stripe, Slack, GitHub, …) — and whenever a task would write fetch(), axios, or process.env in feature code, even if they don't say "service".
---

# pxkit Service & Boundary

How to wrap external chaos behind a typed boundary. Full rules in [references/services.md](references/services.md) and [references/errors.md](references/errors.md). Load `pxkit-conventions` for naming, structure, and testing.

## Gates

- **No `fetch`, headers, `try/catch`, or `AbortSignal.timeout` inside a service** when a shared `http` client exists (or can be created once). Re-typing them per service is the boilerplate that multiplies by every endpoint in a large codebase.
- **No throw crosses into the UI.** A service returns `{ ok: false, errorKey }`; a thrown error becomes an unhandled rejection and a blank screen.
- **No vendor DTO type leaves the service file.** Once `subscription_id` reaches a component, the vendor owns your codebase's vocabulary.
- **No `process.env` in a service.** Read the typed `env.ts` so a missing variable fails at boot, not at the first request.
- **No error key that is a sentence, and no `_FAILED` suffix on a key whose reason is known.**
- **Present the operation contract (step 2) and wait for confirmation** before creating files.

## 1. Inspect the repo

Before creating files, find what already exists and reuse it:

- `Result<T, K>` type — define once if missing (`types/result.ts`).
- Shared `http` client (`lib/http.ts`) — define once if missing; it owns base URL, auth headers, JSON, timeout, and status → `errorKey` mapping.
- `errorKeyFromResponse` / `errorKeyFromException` helpers (`lib/error-keys.ts`) — the client uses them; a raw-SDK service that cannot go through `http` uses them directly.
- Typed `env.ts`.
- Existing services in the same feature — match file location, naming, and how they call `http`.

## 2. Define the operation contract

| Item | Example |
| --- | --- |
| Operation name | `submitContactMessage` |
| Success shape | `null` or domain type `Invoice` |
| Payload | zod schema → `z.infer` type |
| Error keys (narrowed) | `'CONTACT_SUBMIT_FAILED' \| SharedErrorKey` + reason keys like `'CONTACT_RATE_LIMITED'` when known |
| External system | REST endpoint, DB, vendor SDK |

Add new keys to the feature's `constants/error-keys.ts`. Name the **reason when known** (`INVOICE_NOT_FOUND` on 404); the operation catch-all only when the reason is unknown.

## 3. Separate decisions from actions

| Layer | Lives in | Tested |
| --- | --- | --- |
| Pure mapping / validation logic | `lib/` — `parseInvoice`, `buildQuery` | Yes — colocated `*.test.ts` |
| I/O shell | `services/` or `actions/` | Integration/manual; logic stays in `lib/` |

Vendor DTO shapes never leave the service file; map to internal domain types inside it, parsing wire values (date strings, numeric strings, vendor enums) to domain types **once** there.

## 4. Service function template

The service names the endpoint, narrows the keys, and maps the DTO. Nothing else:

```ts
// services/contact.ts — write with no body payload back
import type { Result } from '@/types/result';
import { http } from '@/lib/http';
import { type ContactFormPayload } from '../lib/contact-schema';

export const submitContactMessage = (
  payload: ContactFormPayload,
): Promise<Result<null, ContactErrorKey>> =>
  http.post<null, ContactErrorKey>('/contact', payload, { fallbackKey: 'CONTACT_SUBMIT_FAILED' });

// services/invoice.ts — read + DTO map: http returns the raw DTO, the service maps it
export const fetchInvoice = async (id: string): Promise<Result<Invoice, InvoiceErrorKey>> => {
  const res = await http.get<VendorInvoiceDto, InvoiceErrorKey>(`/invoices/${id}`, {
    fallbackKey: 'INVOICE_FETCH_FAILED',
    notFoundKey: 'INVOICE_NOT_FOUND',
  });
  return res.ok ? { ok: true, data: parseInvoice(res.data) } : res;
};
```

- The client already returns `{ ok: false, errorKey }`; a service that maps a DTO just forwards `res` on failure.
- Timeout, auth headers, and status → `errorKey` mapping live in the client. Pass `signal` for caller cancellation and `notFoundKey` for a 404 reason key.
- Writes around tab close: pass `keepalive: true` on fire-and-forget flushes only, never on reads.
- Untrusted boundary: `schema.safeParse(res.data)` in the service before mapping; the client stays generic.
- A service that must call a **raw vendor SDK** (not HTTP) keeps its own `try/catch` with `console.error('Error in <fn>::', error)` and `errorKeyFromException`; the `http` client is for fetch.

## 5. Schema at the boundary

Colocate the zod schema with the operation; one schema drives service validation and form validation:

```ts
export const contactFormSchema = z.object({
  email: z.string().email(),
  message: z.string().min(10),
});
export type ContactFormPayload = z.infer<typeof contactFormSchema>;
```

Validate inbound payloads at the top of the service, or in the action before delegating.

## 6. Server action / route handler shell

**Server action** (`actions/`): a thin `'use server'` wrapper — auth check, validate, call service, return the `Result` as a plain object.

```ts
'use server';

export const submitContact = async (payload: ContactFormPayload): Promise<Result<null, ContactErrorKey>> => {
  const parsed = contactFormSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, errorKey: 'CONTACT_VALIDATION_FAILED' };
  return submitContactMessage(parsed.data);
};
```

**Route handler**: use the repo's higher-order wrapper when one exists (`export const POST = withAuth(handleCreateOrder)`); otherwise guard clauses at the top, then delegate to the service.

## 7. File layout

Colocate with the feature:

```
services/contact.ts           # I/O + DTO mapping
actions/submit-contact.ts     # 'use server' thin shell (if needed)
lib/contact-schema.ts         # zod + mappers — tested
constants/error-keys.ts       # ContactErrorKey union
types/result.ts               # shared Result (repo-level, once)
lib/http.ts                   # shared fetch client (repo-level, once)
lib/error-keys.ts             # errorKeyFromResponse, errorKeyFromException (repo-level, once)
```

Kebab-case filenames, named exports, no barrel `index.ts`.

## 8. Verify

Run each check; do not report done on a hunch.

- `rg "fetch\(|AbortSignal\.timeout|process\.env" <feature>/services <feature>/actions` returns nothing (raw-SDK services excepted, and those show `Error in <fn>::` on every catch).
- `rg "<VendorDto name>" --glob '!<feature>/services/**'` returns nothing; no vendor type escapes the service file.
- `rg "throw " <feature>/services` returns only invariant guards (programmer errors), never a user-facing failure.
- Every key in the operation's `Result<T, K>` is in `constants/error-keys.ts`; a foreign key is a type error at the call site.
- Pure mappers in `lib/` have tests; the repo's `typecheck`, `lint`, and `test` scripts pass.
- Final test: would a senior engineer call this overcomplicated?
