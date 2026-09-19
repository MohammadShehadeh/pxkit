# Services & Boundaries

**Put boundaries around external chaos.** External systems get an adapter; their shapes never become the language of the codebase.

- A vendor's shape stops at the service that owns it — DB rows, HTTP response bodies, framework request objects, and SDK types (Stripe, Slack, GitHub, Salesforce) map to domain types at the boundary and never leak into UI or business logic.
- Env vars are read in one place: a typed, zod-validated `env.ts` — never `process.env` scattered across files.

## The service layer

- Every external call lives in a **service function** (`services/`, `actions/`) that returns a **normalized, UI-shaped `Result` and never throws to the UI**. Failures are error keys (see [errors.md](errors.md)). The fetch itself goes through the one shared client (below) — the service only names the endpoint, narrows the keys, and maps the DTO:

```ts
// types/result.ts — defined once per repo, imported everywhere; K extends string (defaults to
// ErrorKey) so shared utilities work — the operation's declared Result<T, K> narrows it (see errors.md)
export type Result<T, K extends string = ErrorKey> =
  | { ok: true; data: T }
  | { ok: false; errorKey: K; meta?: Record<string, string | number> };

// services/contact.ts — no headers, no try/catch, no timeout: the client owns those
import { http } from '@/lib/http';

export const submitContactMessage = (
  payload: ContactFormPayload,
): Promise<Result<null, ContactErrorKey>> =>
  http.post<null, ContactErrorKey>('/contact', payload, { fallbackKey: 'CONTACT_SUBMIT_FAILED' });
```

- **Map external DTOs to internal shapes at the boundary.** The vendor response is consumed inside the service; only the domain shape leaves it:

```ts
// services/billing.ts — vendor snake_case never escapes this file
const parseSubscription = (dto: VendorSubscriptionDto): Subscription => ({
  id: dto.subscription_id,
  status: dto.state === 'ACTIVE' ? 'active' : 'canceled',
  renewsAt: new Date(dto.next_billing_time),
});
```

- **Validate at the boundary with zod.** Schemas co-located with the service; payload types via `z.infer`. The same schema drives form validation:

```ts
export const contactFormSchema = z.object({
  email: z.string().email(),
  message: z.string().min(10),
});
export type ContactFormPayload = z.infer<typeof contactFormSchema>;
```

- Server Actions (`'use server'`) live in `actions/`, return plain UI-shaped objects, and convert failures into `{ ok: false, errorKey }` — never a thrown error crossing the wire.
- Route handlers that need cross-cutting checks use a **higher-order middleware wrapper**, not inline checks in every handler:

```ts
export const POST = withAuth(handleCreateOrder); // auth + validation before delegating
```

## The shared HTTP client

**One `fetch` wrapper; every service goes through it.** Base URL, default and auth headers, JSON encode/parse, the timeout, and the status/exception → `errorKey` mapping are written **once** in a `createHttp` factory — never re-typed per service. A service that repeats headers + `try/catch` + `AbortSignal.timeout` + `errorKeyFromResponse` is exactly the boilerplate this removes, and it multiplies by every endpoint in a large codebase.

```ts
// lib/http.ts — a createHttp factory; the request logic is written once, instances are thin
import type { Result } from '@/types/result';
import type { SharedErrorKey } from '@/constants/error-keys';
import { errorKeyFromException, errorKeyFromResponse } from '@/lib/error-keys';
import { authHeaders } from '@/lib/auth-headers';
import { env } from '@/lib/env';

interface HttpConfig {
  baseUrl: string;
  headers?: () => Record<string, string> | Promise<Record<string, string>>; // per-request auth/tracing; server & client pass different thunks
}

interface HttpOptions<K extends string> {
  fallbackKey: K;         // non-ok status the shared map doesn't cover
  notFoundKey?: K;        // 404 → reason key instead of the operation catch-all
  signal?: AbortSignal;   // caller cancellation, combined with the timeout
  timeoutMs?: number;     // default 10_000
  keepalive?: boolean;    // fire-and-forget writes around tab close (never for reads)
}

// K is `extends string`, never the app-wide ErrorKey union: the client stays a generic utility a
// packaged feature can use with its own keys — the service's declared Result<T, K> is what narrows them.
export const createHttp = ({ baseUrl, headers }: HttpConfig) => {
  const request = async <T, K extends string>(
    path: string,
    init: RequestInit,
    { fallbackKey, notFoundKey, signal, timeoutMs = 10_000, keepalive }: HttpOptions<K>,
  ): Promise<Result<T, SharedErrorKey | K>> => {
    const timeout = AbortSignal.timeout(timeoutMs);
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        keepalive,
        headers: { 'Content-Type': 'application/json', ...(await headers?.()), ...init.headers },
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      });
      if (!response.ok) return { ok: false, errorKey: errorKeyFromResponse(response, fallbackKey, notFoundKey) };
      return { ok: true, data: response.status === 204 ? (null as T) : await response.json() };
    } catch (error) {
      console.error(`Error in http ${init.method ?? 'GET'} ${path}::`, error);
      return { ok: false, errorKey: errorKeyFromException(error) };
    }
  };

  return {
    get: <T, K extends string>(path: string, opts: HttpOptions<K>) => request<T, K>(path, { method: 'GET' }, opts),
    post: <T, K extends string>(path: string, body: unknown, opts: HttpOptions<K>) =>
      request<T, K>(path, { method: 'POST', body: JSON.stringify(body) }, opts),
    patch: <T, K extends string>(path: string, body: unknown, opts: HttpOptions<K>) =>
      request<T, K>(path, { method: 'PATCH', body: JSON.stringify(body) }, opts),
    delete: <T, K extends string>(path: string, opts: HttpOptions<K>) => request<T, K>(path, { method: 'DELETE' }, opts),
  };
};

// lib/http-clients.ts — one instance per backend; a second base URL / auth is a new instance, not a branch
export const http = createHttp({ baseUrl: env.API_BASE_URL, headers: authHeaders });      // the app's own API
// export const billing = createHttp({ baseUrl: env.BILLING_URL, headers: billingAuth });  // a vendor, its own auth
```

The client returns the **raw DTO** as `T`; the service maps it to the domain shape and narrows the keys — vendor snake_case still never escapes the service file:

```ts
// services/invoice.ts — endpoint + DTO map, nothing else
export const fetchInvoice = async (id: string): Promise<Result<Invoice, InvoiceErrorKey>> => {
  const res = await http.get<VendorInvoiceDto, InvoiceErrorKey>(`/invoices/${id}`, {
    fallbackKey: 'INVOICE_FETCH_FAILED',
    notFoundKey: 'INVOICE_NOT_FOUND',
  });
  return res.ok ? { ok: true, data: parseInvoice(res.data) } : res;
};
```

- **The timeout lives in the client**, so every call has one — a hung request becomes a caught `TimeoutError` that `errorKeyFromException` maps to `TIMEOUT` (vs `NETWORK` for a dead connection), never an infinite spinner. Pass `signal` for caller cancellation; it is combined with the timeout via `AbortSignal.any`.
- **One instance per backend, from the `createHttp` factory** — a second base URL / auth scheme (a vendor vs your own API) is another exported instance, never an `if (vendor)` branch. A cross-cutting concern added in `createHttp` reaches every instance at once: tracing headers, structured logging (swap the `console.error`), rate-limit backoff, a token-refresh retry — retry idempotent methods only, never blind-retry a `POST`.
- **Server and client resolve auth differently**, so `headers` is a thunk (and may be async): the server instance reads the request (`cookies()` / `headers()`), the client instance reads its token store. Build one instance per runtime rather than force a single module to be both.
- **`K extends string`, not the app-wide `ErrorKey`** — the client is a generic utility that knows only `SharedErrorKey` (401/404/429); the operation's key comes from the caller and the *service's* declared `Result<T, FooErrorKey>` is what narrows it. A feature extracted to a package brings its own keys without the shared layer importing a global union.
- **Validate the response, don't just cast it.** `response.json()` is typed `T` by assertion, not proof — an owned API still drifts. Past a handful of endpoints, `schema.safeParse(res.data)` in the service before mapping; the client stays generic. It is JSON-only by design — blob / CSV / SSE responses get their own path.
- **Writes that may fire around page exit** pass `keepalive: true` — flushing a debounced save, "mark as read", analytics. Body is capped (~64 KiB), response is fire-and-forget — never for reads.

See [data.md](data.md) for shaping the data a service returns — parsing, formatting, search, and pagination.

## Separate decisions from actions

Pure functions decide (`calculateDiscount`, `buildSearchQuery`, `parseSubscription`); thin shells act (call the API, set state, show the toast). The pure part is what gets unit tests — no mocking I/O to test logic.
