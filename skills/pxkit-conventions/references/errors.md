# Error Handling

**Errors are codes, not sentences.** Every failure surfaces to the frontend as a stable SCREAMING_SNAKE_CASE **error key**; the frontend decides what to show based on that key — which keeps copy out of services and stays i18n-ready.

## Error keys

- Keys are **string-literal unions** — the union is the source of truth and the value is the name; no const object, no second spelling to keep in sync. **Shared keys are transport/session-level only** (`NETWORK`, `TIMEOUT`, `UNAUTHORIZED`, `RATE_LIMITED`); everything else is feature-prefixed. Compose the app-wide union from per-feature sections — one module in a single app, or per-feature `constants/error-keys.ts` when features are packaged:

```ts
// constants/error-keys.ts
export type SharedErrorKey = 'NETWORK' | 'TIMEOUT' | 'UNAUTHORIZED' | 'RATE_LIMITED';

export type UploadErrorKey = SharedErrorKey | 'UPLOAD_FILE_TOO_LARGE' | 'UPLOAD_FORMAT_NOT_SUPPORTED';
export type InvoiceErrorKey = SharedErrorKey | 'INVOICE_NOT_FOUND' | 'INVOICE_FETCH_FAILED';

export type ErrorKey = UploadErrorKey | InvoiceErrorKey;
```

- **Name the reason when you know it; the operation only as the catch-all.** `INVOICE_NOT_FOUND` when the API 404s; `INVOICE_FETCH_FAILED` only for "server said no and we don't know why". No `_FAILED` on reason keys — every error is a failure, so the suffix adds nothing — and reason keys are what make copy actionable ("that file is too large" beats "something went wrong").
- Keys are a **wire contract**, deliberately decoupled from any translation-file layout — reorganizing dictionaries never changes a key.
- Services, actions, and hooks return `{ ok: false, errorKey }` — never a human-readable message, never a raw `Error`. `Result` is **generic over the keys the operation can actually produce**, so call sites handle its failures exhaustively and a foreign key is a type error (the default keeps un-narrowed signatures compiling). The parameter is `K extends string` (defaulting to `ErrorKey`), not `K extends ErrorKey`: the container itself stays usable by shared utilities and packaged features with their own keys — each operation's declared `Result<T, FooErrorKey>` is what actually narrows them:

```ts
// types/result.ts — the one shared definition, imported everywhere
export type Result<T, K extends string = ErrorKey> =
  | { ok: true; data: T }
  | { ok: false; errorKey: K; meta?: Record<string, string | number> };

// services/invoice.ts — this signature is the operation's failure contract
export const fetchInvoice = (id: string): Promise<Result<Invoice, InvoiceErrorKey>> => …
```

- `meta` carries **interpolation values only**, adopted per key when the copy needs it — `{ ok: false, errorKey: 'UPLOAD_FILE_TOO_LARGE', meta: { maxSizeMb: 10 } }` → "Files over 10 MB aren't supported". The common failure stays two fields; never smuggle messages or vendor payloads through it.
- The frontend resolves the key to copy at render time (i18n dictionary, toast, inline field error). i18n apps keep a flat `errors` section in the dictionary (``t(`errors.${errorKey}`, meta)``); single-language apps use an exhaustive record — TS then forces copy for every key:

```tsx
{isError ? <p role="alert">{t(`errors.${errorKey}`)}</p> : null}
```

```ts
// single-language apps — adding a key without copy is a compile error
export const errorCopy: Record<ErrorKey, string> = {
  NETWORK: 'Connection failed. Check your internet and try again.',
  TIMEOUT: 'That took too long. Try again.',
  UNAUTHORIZED: 'You need to sign in to do that.',
  RATE_LIMITED: 'Too many requests. Give it a moment and retry.',
  UPLOAD_FILE_TOO_LARGE: 'That file is too large.',
  UPLOAD_FORMAT_NOT_SUPPORTED: 'That file format is not supported.',
  INVOICE_NOT_FOUND: 'That invoice does not exist.',
  INVOICE_FETCH_FAILED: 'Could not load the invoice.',
};
```

- Raw error details (stack, vendor payload) are **logged where they happen** and go no further.

## Mapping failures to keys — written once

Two mappings every service needs, defined once in `lib/error-keys.ts`, never inlined per service:

```ts
// HTTP status → shared keys, operation key as fallback — 401/404/429 never collapse into the catch-all.
// K is `extends string`, never the app-wide ErrorKey union, so this shared helper (and the http client
// built on it) stays a generic utility a packaged feature can call with its own keys.
export const errorKeyFromResponse = <K extends string>(response: Response, fallback: K, notFound?: K): SharedErrorKey | K => {
  if (response.status === 401) return 'UNAUTHORIZED';
  if (response.status === 404 && notFound) return notFound;
  if (response.status === 429) return 'RATE_LIMITED';
  return fallback;
};

// thrown fetch errors → TIMEOUT vs NETWORK — "took too long, try again" and "check your
// connection" are different instructions to the user
export const errorKeyFromException = (error: unknown): SharedErrorKey =>
  error instanceof DOMException && error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK';
```

## Guard clauses first, happy path unindented

Validate invariants at the top and throw/return early; avoid `else`:

```ts
if (!portalUrl) throw new Error('portalUrl is required');
if (!response.ok) return { ok: false, errorKey: errorKeyFromResponse(response, 'INVOICE_FETCH_FAILED') };
```

Two failure kinds, two channels: **invariant violations** (programmer error — throw with a dev-facing message, like the `portalUrl` guard; it never reaches the UI) vs **expected failures** (user-visible — return `{ ok: false, errorKey }`). Keys are only for the second kind.

## try/catch at every I/O boundary

Log with the `'Error in <fn>::'` prefix so failures are greppable, then return the key — errors never propagate raw into the UI:

```ts
export const fetchInvoice = async (id: string): Promise<Result<Invoice, InvoiceErrorKey>> => {
  try {
    const response = await fetch(`${env.API_BASE_URL}/invoices/${id}`, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return { ok: false, errorKey: errorKeyFromResponse(response, 'INVOICE_FETCH_FAILED', 'INVOICE_NOT_FOUND') };
    return { ok: true, data: parseInvoice(await response.json()) };
  } catch (error) {
    console.error('Error in fetchInvoice::', error);
    return { ok: false, errorKey: errorKeyFromException(error) };
  }
};
```

For `fetch` calls this whole shape lives **once** in the shared `http` client, not in each service (see [services.md](services.md)) — the block above is what the client does internally, and a real `fetchInvoice` is just `http.get(...)` plus the DTO map. Write it out by hand only in a service wrapping a raw non-HTTP SDK.

## Narrow before reading

`error` is `unknown`; check `instanceof Error` when the log needs details. The UI still only ever receives a key:

```ts
} catch (error) {
  console.error('Error in submitOrder::', error instanceof Error ? error.message : error);
  setState({ status: 'error', errorKey: errorKeyFromException(error) });
}
```

## Surfacing to the user

Failures reach the user through the state machine (`{ status: 'error', errorKey }`) or a toast fed by the resolved copy (``t(`errors.${errorKey}`)`` / `errorCopy[errorKey]`) — never an unhandled rejection, never an inline hardcoded string.
