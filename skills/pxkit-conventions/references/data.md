# Data Shaping

The layer between a service's domain data and what a list / table / detail view renders: **parse once, format at the edge, and search / sort / paginate as pure derivations.** Keeps date-juggling and filtering logic out of components and out of services — where in a large codebase it otherwise gets re-written per screen.

## Parse at the boundary, once

The DTO mapper (see [services.md](services.md)) is the **only** place a wire value becomes a domain value — date strings to `Date`, numeric strings to `number`, vendor enums to a status union. After the mapper, nothing in the app re-parses:

```ts
// inside the service — parse here, once
const parseItem = (dto: ItemDto): Item => ({
  id: dto.id,
  amount: Number(dto.amount_cents) / 100,
  createdAt: new Date(dto.created_at),        // a Date leaves the boundary, never a string
  status: dto.status === 'ACTIVE' ? 'active' : 'archived',
});
```

- A domain type holds **parsed** values (`Date`, `number`, unions) — never `createdAt: string` waiting to be `new Date()`-d at three call sites. Re-parsing after fetch is the disorganization this removes.
- `Invalid Date` / `NaN` at a *read* site means the mapper was skipped — fix the boundary, not the reader.

### Mapper conventions

- **Name it for what it does — no `to` prefix.** Inbound, the mapper *parses* a wire DTO into a domain value: `parseInvoice`, `parseSubscription` — a reader knows the domain type from the call. Outbound, one that ships domain data back out as strings *formats* it: `formatRow`. `parseItem` is fine only while the type really is `Item`; if the name is vaguer than the shape it builds, rename one so the pair reads. A mapper stays a plain named function — no `Mapper` class, no factory or registry to hold a single transform; unnecessary encapsulation is just ceremony around a function.
- **Annotate the DTO in, pin the domain type out, infer everything between.** Typing the parameter (`dto: ItemDto`) guards the untrusted input; the `: Item` return is deliberate — a forgotten or mistyped field errors *here* at the boundary instead of surfacing three call sites downstream. Inside the body, let inference do the rest; don't hand-write types TS already knows (see [typescript.md](typescript.md)).

## Format at the edge

Display strings are produced where they render, by pure `format*` helpers — never stored, never produced in the service (the service returns a `Date`; the view chooses the format), never inlined as `toLocaleString()` sprinkled through JSX:

```ts
// lib/format.ts — Intl formatters built once at module scope (constructing them per call is costly)
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const mediumDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

export const formatMoney = (amount: number) => money.format(amount);
export const formatDate = (value: Date) => mediumDate.format(value);
```

One helper per format, reused everywhere; locale and currency come from config, not hardcoded at each call site in a real i18n app.

## Search, sort, paginate — server first

**Push it to the backend when the backend supports it.** A `?q=&sort=&page=` query is one round trip; re-implementing search over a fully-downloaded table is slower, wrong on the totals, and blind to every row past the current page. Build the params (a pure `buildQuery(filters)` in `lib/`, tested) and let the API do the work — that is the scalable path for any unbounded set.

**Client-side only for lists already fully in memory** (a small settings table, an autocomplete's loaded options) — never as a stand-in for server paging on an unbounded set. When you do it client-side, each step is a **pure, composable function** in `lib/`, not logic tangled into a component:

```ts
// lib/item-view.ts — pure, tested; each step composes, none mutate
export const searchItems = (rows: Item[], q: string): Item[] =>
  q ? rows.filter((r) => r.label.toLowerCase().includes(q.toLowerCase())) : rows;

export const sortItems = (rows: Item[], by: SortKey): Item[] =>
  [...rows].sort(SORTERS[by]);                 // copy first: never sort the source array in place

export const paginate = <T>(rows: T[], page: number, size: number): T[] =>
  rows.slice((page - 1) * size, page * size);
```

Compose them as a **derivation** over the source list — held once, recomputed when inputs change, never copied into its own state:

```ts
const filtered = useMemo(() => sortItems(searchItems(items, q), sort), [items, q, sort]);
const rows = useMemo(() => paginate(filtered, page, PAGE_SIZE), [filtered, page]);
const total = filtered.length;                 // pager count derived from the same filtered set
```

- Source list stays canonical (query cache or one `useState`); `q` / `sort` / `page` are the only stored controls; the rendered rows are **derived**, so they can never drift from the source (the `useState(prop)` mirroring trap, see [hooks-state.md](hooks-state.md)).
- The pager total is `filtered.length` — derived, not a separate counter that goes stale.
- Debounce the search **input**, not the pure filter — `useDeferredValue(q)` (or a debounced setter) feeds `q`; the derivation stays synchronous and testable.

## One builder for a server-side list

When the filtering/paging happens in **your** server layer — a route handler or server component reading `searchParams` over a set you already fetched in full — wrap the whole derivation in one pure builder that returns the page plus its totals:

```ts
// lib/list-view.ts — parse ONCE to domain types, then filter/sort/page on those
interface ListQuery { from?: string; to?: string; status?: Status; page?: number; perPage?: number }
interface ListView { entries: Item[]; total: number; totalPages: number }

export const buildListView = (
  { from, to, status, page = 1, perPage = 12 }: ListQuery,
  raw: ItemDto[],
): ListView => {
  const filtered = raw
    .map(parseItem)                                               // DTO → domain: createdAt is a Date, amount a number
    .filter((e) => !from || e.createdAt >= new Date(from))        // compare Dates …
    .filter((e) => !to || e.createdAt <= new Date(to))
    .filter((e) => !status || e.status === status)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // … never new Date(aFormattedString)

  return {
    entries: filtered.slice((page - 1) * perPage, page * perPage),
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / perPage),
  };
};
```

- **Parse to domain types first, format last.** `createdAt` stays a `Date` so the filter and sort compare `Date`s. Storing `formatDate(createdAt)` on the entry and then `new Date()`-ing that display string back to filter is the format-then-re-parse trap the first rule warns against — and formatted strings don't reliably round-trip. Format in the view, or in a final `.map(formatRow)` if the server must ship strings.
- **Search params are not entity fields.** `from` / `status` / `page` live in the query type, never on `Item`. Don't hang a field on the domain shape just to filter, then strip it back off.
- **A pure function, not a class.** It takes input and returns a result with no lifecycle; a class whose constructor computes everything and exposes fields is a function wearing ceremony. Reach for a class only when instances carry state or have methods called *after* construction (`view.nextPage()`, `view.toCsv()`).
- Still **server-first**: this is for when the full set is already in hand (a BFF/route that fetched everything). If the origin API takes `?q=&page=`, let it page — don't fetch-all to slice in memory.

## What gets tested

The pure functions — `parseItem`, `buildQuery`, `searchItems`, `sortItems`, `paginate`, `buildListView` — get colocated `*.test.ts` (see [testing.md](testing.md)). The `useMemo` wiring does not; it holds no logic of its own.
