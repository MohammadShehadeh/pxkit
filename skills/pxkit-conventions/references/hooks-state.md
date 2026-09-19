# Hooks & State

## Custom hooks

- **Hooks return an object, never a tuple** — expose `status` itself (consumers compare or `switch` exhaustively) plus only the derived flags call-sites actually read. Booleans are always derived from `status`, never stored:

```ts
return {
  submit,
  status: state.status,
  isLoading: state.status === 'loading',
  errorKey: state.status === 'error' ? state.errorKey : undefined,
};
```

- **Async/UI state is one `status` union in one `useState`** — a bare union by default, a discriminated union when data/`errorKey` must be tied to the state (see [typescript.md](typescript.md)); never parallel `isLoading`/`isError`/`isSuccess` booleans that can contradict. Failures carry an **error key**, not a message string (see [errors.md](errors.md)).
- **Never mirror server state into `useState` without reconciliation** (`useState(propFromServer)`) — the prop is read once and the copy goes stale on the next refetch. Optimistic UI runs on `useOptimistic` + `useTransition` — a derived overlay over the last server-confirmed value; the API response decides what stays (see [optimistic-ui.md](optimistic-ui.md)).
- Side-effect hooks always clean up on unmount.

## Server state

**Server state is not component state.** Data owned by the backend — lists, entities, anything fetched — belongs in a **query cache (TanStack Query by default)**, not `useState`. The `status`-union rule above is for *local* async (a form submit, a one-shot action). A `useEffect` + `useState` + `fetch` to load and hold server data is the anti-pattern the cache replaces: it refetches on every mount, can't dedupe concurrent callers, and goes stale with no way to revalidate.

```ts
// lib/query-error.ts — carries the key through React Query's error channel, once per repo
export class QueryError extends Error {
  constructor(readonly errorKey: ErrorKey) {
    super(errorKey);
  }
}

// the query fn calls the service and unwraps Result — the boundary contract (services.md) is unchanged
export const useInvoices = (filters: InvoiceFilters) =>
  useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      const res = await fetchInvoices(filters);
      if (!res.ok) throw new QueryError(res.errorKey);  // errorKey survives; React Query drives loading/error
      return res.data;
    },
  });
```

- Services still return `Result`; the thin query fn throws the `errorKey` so React Query owns `isPending` / `isError`, and the UI reads `error.errorKey` to resolve copy — the key contract ([errors.md](errors.md)) stays intact, no message strings.
- Writes go through `useMutation`; on success `invalidateQueries({ queryKey })` refetches the affected lists — never hand-sync a local copy.
- **Live updates are refetch, not a hand-rolled loop.** A `setInterval` + `fetch` + `setState` poll leaks timers, stacks overlapping requests, and ignores tab focus — reach for the cache's own controls instead:
  - Polling → `refetchInterval` on the query (a function value can back off or stop once the data has settled).
  - Realtime push → a WebSocket / SSE handler writes the message straight into the cache with `queryClient.setQueryData(key, next)`, no refetch round trip.
  - "Update when the user comes back" → `staleTime` + `refetchOnWindowFocus`, which needs no polling at all.

`useOptimistic` ([optimistic-ui.md](optimistic-ui.md)) still handles the in-flight write overlay; the query cache owns the confirmed server value underneath it.

## Context

- Context via a `createSafeContext` factory that throws when the provider is missing — no silently-undefined contexts:

```tsx
interface SafeProviderProps<ContextValue> {
  children: React.ReactNode;
  value: ContextValue;
}

export function createSafeContext<ContextValue>(errorMessage: string) {
  const Context = createContext<ContextValue | null>(null);
  const useSafeContext = () => {
    const ctx = useContext(Context);
    if (ctx === null) throw new Error(errorMessage);
    return ctx;
  };
  const Provider = ({ children, value }: SafeProviderProps<ContextValue>) => (
    <Context.Provider value={value}>{children}</Context.Provider>
  );
  return [Provider, useSafeContext] as const;
}

const [CheckoutProvider, useCheckout] = createSafeContext<CheckoutContextValue>(
  'useCheckout must be used within a CheckoutProvider'
);
```

`createSafeContext` is a factory, not a hook, so its tuple return is fine: it is destructured once at module scope, never at a call site.

**When to use context:** state genuinely shared by a subtree (auth/session, theme, an active checkout) that many descendants read. **When not:** to skip one level of props — compose via `children` first (see [components.md](components.md)); and never for server data a Server Component could fetch where it's used.
