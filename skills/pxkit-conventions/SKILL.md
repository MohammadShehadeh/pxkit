---
name: pxkit-conventions
description: The pxkit house style for TypeScript, React, and Next.js — naming, components, hooks and state, services and Result/ErrorKey boundaries, data shaping, styling with shadcn/ui and Tailwind, structure, and testing. Use this whenever you write, edit, refactor, or review any .ts/.tsx file — a component, hook, service, server action, route handler, type, or stylesheet — even for a "small" change or when the user does not mention conventions. Also use it when the user asks whether code "follows the house style" or "matches the repo".
---

# pxkit Conventions

The house style, condensed. Full rules with examples live in this skill's `references/` directory.

## Red lines

Everything else in this skill is judgment. These are not.

- **Traceability.** A reader must understand what a function or component does without opening more than one other file. If understanding it takes 3–4 jumps, the structure is wrong: inline it, colocate it, or pass the data directly.
- **Flat call stacks.** Page → section → primitive. Component → hook → service → boundary. No pass-through wrappers, no helper that only calls another helper, no prop drilled past one intermediate.
- **Duplication over the wrong abstraction.** Two similar blocks of code are fine. A shared function that needs a flag, an options bag, or a generic parameter to serve two callers is two functions. Extract only when the third caller arrives and the shape is identical.
- **Simple over clever.** The obvious solution beats the elegant one. If a reviewer would need to think to see that it works, rewrite it so they don't.
- **Written for humans.** Names say what the value is in business terms (`isEligibleForRenewal`, not `flag2`). Comments explain *why*, never restate *what* the code already says. No comment is better than a comment that repeats the line below it.

## How to work with this skill

1. **Inspect the repo before writing.** Layout (route-colocated vs `features/`), path aliases, UI layer, test runner, and the shared layers already in place: `http` client, `Result` type, error-key union, `format*` helpers. Match what exists; a second copy of a shared layer is worse than either copy alone. When a rule here says "the project's …", the repo wins over any example path.
2. **Read the topic reference before touching that area.** The cheat sheet orients; the reference has the exact shape, the examples, and the exceptions.

   | You are about to… | Read first |
   | --- | --- |
   | plan a change, decide scope, define done criteria | `core-principles` |
   | create or rename files, identifiers, error keys | `naming`, `errors` |
   | write a component or restructure a tree | `components`, `ui-composition`, `styling`, `icons`, `ui-ux` |
   | write a hook, manage async/server state, add a context | `hooks-state`, `typescript`, `optimistic-ui` |
   | build a form | `forms` (or the `pxkit-form` skill) |
   | call an API / DB / SDK, add an action or route handler | `services`, `errors`, `data` (or `pxkit-service`) |
   | add a page, route group, metadata, or client boundary | `nextjs` (or `pxkit-nextjs-page`) |
   | scaffold a feature folder or package | `structure` (or `pxkit-feature`) |
   | write or place tests | `testing` |
   | review a diff | `review-checklist` |

3. **Plan, then confirm.** State the approach as verifiable targets and a surgical change set with an explicit out-of-scope list. Wait for confirmation. Ask when the request is ambiguous instead of picking an interpretation.
4. **Self-review before reporting done.** Run the repo's `typecheck`, `lint`, and `test` scripts, then walk `references/review-checklist.md` over your own diff.

## Cheat sheet

### Process

- Plan before coding; turn vague asks into verifiable targets; confirm the approach.
- Minimum code that solves the problem. No speculative abstractions, no flexibility nobody asked for.
- Surgical diffs. Every changed line traces to the request; neighboring code is left alone.
- Say "I don't know" instead of guessing. Push back when a simpler approach exists.

### Naming & files

- kebab-case for every filename, components included. One primary export per file; filename mirrors the export.
- `.tsx` if and only if the file contains JSX.
- camelCase variables and functions; PascalCase components and types. Booleans read `is/has/should`; internal handlers `handle*`; callback props `on*`.
- **No barrel files, no re-export middlemen.** Never create an `index.ts` that only re-exports, and never import a symbol into a file just to export it again so consumers import it from there. Import the defining file directly, via the project's alias. The one exception is a re-export that adds a directive the source lacks (`components/motion.tsx` adding `'use client'`).

### Components

- Named arrow-function `const` with a named export. **No default exports** except Next.js file conventions (`page.tsx`, `layout.tsx`, `sitemap.ts`).
- Props: `interface <Component>Props` (no `I` prefix), destructured in the signature. Only what the component reads: two fields, not the whole entity. `children: React.ReactNode`.
- Compound components are flat named exports from one file (`Card`, `CardHeader`), never `Card.Header` statics.
- Data-driven rendering: content in typed `as const` arrays, mapped to markup.
- Compose via `children`/slot props, read data where it is used, lift state only to the lowest common owner.
- `memo`/`useMemo`/`useCallback` only for measured hot paths; skip them entirely in React Compiler projects.

### Hooks & state

- Hooks return an object, never a tuple: `status` plus only the derived flags call sites read.
- Local async state is **one `status` union in one `useState`** (`'idle' | 'loading' | 'success' | 'error'`); discriminated-with-payload only when `data`/`errorKey` must be tied to the state. Never parallel `isLoading`/`isError` booleans; never a stored boolean that could be derived.
- Failures carry an `errorKey`, never a message string.
- **Server state lives in a query cache (TanStack Query)**, never `useState` + `useEffect` + `fetch`. Live updates are `refetchInterval` / `invalidateQueries` / socket `setQueryData`, never a hand-rolled `setInterval`.
- Never mirror a server prop into `useState` without reconciliation. Context via a `createSafeContext` factory that throws without a provider.

### TypeScript

- `interface` for object shapes; `type` for unions and aliases. String-literal unions or `as const` + `keyof typeof`, never `enum`.
- Derive, don't restate: `z.infer`, `ReturnType`, `keyof typeof`, `Pick`. Annotate only real contracts (params, exported signatures, a mapper's domain return); let obvious consts and returns infer.
- `unknown` over `any`. Model invalid states out (Draft vs Saved shapes, status unions).
- Array syntax follows the repo (`T[]` or `Array<T>`); never churn-rewrite it. JSDoc only where the contract isn't obvious from the signature.

### Styling & UI

- Tailwind v4 (or the repo's established utility system). No inline styles. All class merging through `cn()`.
- Semantic tokens (`bg-muted`, `text-primary`), never arbitrary hex or raw palette colors; no manual `dark:` overrides.
- Customization ladder, stop at the first that works: built-in variant → `className` for layout only → token → new variant in the component source → wrapper.
- `gap-*` over `space-*`; `size-*` over `w-`/`h-` pairs; `truncate`; no manual z-index on overlays; hoist repeated class strings to local consts.
- Base UI is **shadcn/ui** when the project uses it, added via the CLI, never hand-written or swapped for another library. Use the full composition API (Card = Header/Content/Footer; items inside their Group; `TabsTrigger` inside `TabsList`). Existing primitive over custom markup (`Separator`, `Skeleton`, `Badge`, `Alert`).
- Dialog/Sheet/Drawer always get a Title (`sr-only` is fine). `Avatar` always has `AvatarFallback`.
- Forms: `FieldGroup` → `Field` → `FieldLabel` + control; `FieldSet` + `FieldLegend` for groups; `InputGroup` + `InputGroupAddon` for buttons in inputs; `ToggleGroup` for 2–5 option sets. Never raw `div` + `space-y-*`.
- Icons: import directly from the project's icon library; pass component objects, not string keys; no sizing classes on icons inside components that size their own.
- A11y always: `focus-visible:`, `sr-only`, `aria-hidden` on decoration, ARIA labels on icon-only triggers, `role="alert"` on error output.
- Reuse existing patterns, tokens, and layouts before inventing. Hierarchy tracks importance; spacing comes from the scale; responsive behavior is explicit per breakpoint. Design the full journey: hover/focus/active/disabled, loading, empty, error, success.

### Next.js

- Server Components by default; `'use client'` at the leaves only, centralized in re-export files (`components/motion.tsx`) rather than scattered.
- Pages are thin `export default function` server components composing named `<Section />` components. Route groups `(folder)` by domain, each with its own `layout.tsx`.
- Metadata: root layout owns `metadataBase` and the title template; pages export bare `title` + `description` + `openGraph` + `twitter` + `alternates.canonical`, via a `createPageMetadata(config)` factory for repeated route families.
- Env through one typed, zod-validated `env.ts`; never `process.env` in feature code.

### Boundaries, errors, data

- Every external call lives in a service returning the shared `Result<T, K>` (`{ ok: true, data } | { ok: false, errorKey, meta? }`), `K` narrowed to that operation's keys. **Services never throw to the UI.**
- Every fetch goes through **one shared `http` client** (`lib/http.ts`) that owns base URL, auth headers, JSON, timeout, and status → `errorKey` mapping. A service names the endpoint, narrows the keys, and maps the DTO; it never re-types `fetch` + headers + `try/catch`.
- Vendor DTOs stop at the service file. Parse wire values to domain types **once** in the mapper (`parseInvoice`: strings → `Date`/`number`/unions); nothing downstream re-parses.
- Format at the edge with pure `format*` helpers (`Intl.*` built once at module scope), never in the service, never inlined in JSX.
- Search/sort/paginate server-side when the API supports it (tested `buildQuery(filters)`); client-side only for small in-memory lists, as pure `lib/` functions composed in a `useMemo` derivation. The pager total is `filtered.length`, never a stored counter.
- **Errors are codes, not sentences.** `errorKey` is a SCREAMING_SNAKE literal from the string-literal `ErrorKey` union. Shared keys are transport/session only (`NETWORK`, `TIMEOUT`, `UNAUTHORIZED`, `RATE_LIMITED`); everything else is feature-prefixed and **named by reason when known** (`INVOICE_NOT_FOUND`), with the operation catch-all (`INVOICE_FETCH_FAILED`) only for unknown reasons.
- Status and exception mapping happen once, in `errorKeyFromResponse` / `errorKeyFromException`. `meta` carries interpolation values only. Copy resolves at render time (``t(`errors.${errorKey}`, meta)`` or an exhaustive `Record<ErrorKey, string>`); no hardcoded user-facing error strings anywhere.
- Guard clauses and early returns over `else` mazes. `try/catch` at I/O with `console.error('Error in <fn>::', error)`; raw error details stop at the log.
- Optimistic UI only for predictable, reversible, low-stakes writes, via `useOptimistic` + `useTransition` in one shared hook; destructive, money/permission, and server-decided actions render `isPending` and wait.

### Structure & testing

- Feature modules colocated in the app by default (route folder or `features/<name>/`, whichever the repo uses); a shared package only for 2+ consumers.
- Responsibility-based dirs: `components/`, `hooks/`, `actions/`, `services/`, `types/`, `constants/`, `lib/`. Create a directory only when a file exists for it.
- Separate decisions from actions: pure logic in `lib/` with colocated `*.test.ts`; thin shells (hooks, actions, services) call it. Use the repo's test runner (Vitest + Testing Library when none is set).

## Reviewer rejects on sight

- No barrel `index.ts`; no file that imports a symbol only to re-export it; no default exports outside Next.js file conventions; no PascalCase filenames.
- No `any`; no `enum`; no parallel async booleans; no server data in `useState` + `fetch`.
- No raw `fetch` in a service when a shared `http` client exists; no service that throws to the UI; no vendor DTO type imported outside its service.
- No hardcoded user-facing error strings; no error key that is a sentence; no `process.env` outside `env.ts`.
- No inline styles, arbitrary hex, or manual `dark:` overrides; no raw-div form markup when Field primitives exist.
- No helper, wrapper, or abstraction with a single caller; no comment that restates the code; no change that requires 3+ file jumps to follow.
- No code before the plan is confirmed; no changed line that doesn't trace to the request.
