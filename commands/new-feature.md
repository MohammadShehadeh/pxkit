---
description: Plan and build a new feature the house way — user journey and business logic first, atomic UI decomposition, explicit state/communication map, then home, structure, boundaries, and no premature abstraction
argument-hint: <feature-name> [what it does]
---

Build a new feature: $ARGUMENTS

Load the `pxkit-conventions` skill. Work through the phases in order — phases 1–3 are the plan; no code before it's confirmed.

## 1. Understand — user journey & business logic

- **Walk the user journey end to end**, step by step: what the user sees, does, and expects at each point, including empty, loading, and failure states. A "Gmail-like inbox" becomes: scan list → open message → read → act (reply / archive / delete) → return to list.
- **Extract the business logic from the journey**: the rules and decisions behind each step (what marks a message read? who can archive? what sorts the list?). These are pure decisions — they'll live in `lib/`, tested, separate from the UX flow that triggers them.
- **Restate both as verifiable targets**: concrete behaviors, inputs/outputs, error cases with their `ErrorKey`s — not vague ambitions.
- **Survey what exists**: grep for similar features, reusable services/hooks/primitives. Extending beats duplicating; duplicating a small pure thing beats coupling to another feature's internals.
- **State assumptions and ask** about anything ambiguous — do not pick an interpretation and run.

## 2. Decompose the UI — atomic design, high level first

Once the journey is clear, the architecture falls out of it. Outline top-down, then build bottom-up:

- **Pages** — one per journey destination (`/inbox`, `/inbox/[messageId]`), thin server components that only compose sections.
- **Blocks / sections** — one per journey step or screen region (`MessageList`, `MessageToolbar`, `ThreadView`, `ComposePanel`), each a single responsibility.
- **Primitives** — existing shared UI first (`Button`, `Badge`, `Avatar`, `Field`); a new primitive only when no shared one fits.

Keep the atomic layers flat in the tree: page → section → primitive, no pass-through wrappers. Name every unit by business meaning (`MessageRow`, not `ListItem2`), and list what data each one renders — content as typed `as const` arrays where it's static.

## 3. Map state & communication

For every piece of state the journey needs, decide before coding:

- **Who owns it** — the lowest common owner of the components that read it. Selected message → the inbox page (or the URL param); a row's hover state → the row.
- **Server vs client** — server-owned data is fetched where it's used (server components), never mirrored into `useState`; async flows are one `status` union with an `errorKey`, booleans derived.
- **How components communicate** — parent → child via props; child → parent via `on*` callbacks; siblings via the shared owner; a genuinely subtree-wide concern (active thread, selection mode) via one safe context; cross-page via the URL. Write the pairs down: "MessageRow → onArchive → MessageList → useArchiveMessage".
- **What's optimistic** — reversible, low-stakes writes (archive, star) get `useOptimistic` + reconcile; destructive or server-decided actions render `isPending` and wait.

**Present phases 1–3 as the plan** — journey, component tree, state map, surgical change set with an explicit out-of-scope list — and wait for confirmation.

## 4. Pick the feature's home

- **Default: feature-colocated module** — route folder or `features/<name>/` (whichever the repo uses) owns `components/`, `hooks/`, `lib/`, `constants/`, colocated tests. Only cross-feature code is hoisted.
- **Shared package only when** the feature is consumed by 2+ apps or must be versioned independently — then follow the `pxkit-feature` skill as the blueprint.
- Never manufacture a package for one consumer.

## 5. Structure — organized by responsibility

- Consistent taxonomy: `components/`, `hooks/`, `actions/`, `services/`, `types/`, `constants/`, `lib/` — create a directory only when a file exists to live there, and **no `index.ts` barrels anywhere**.
- **Separate decisions from actions**: the business rules from phase 1 go in `lib/` as pure functions with colocated Vitest tests; thin shells (hooks, actions) call them.

## 6. Boundaries

- **Every external call behind a service** returning the shared `Result<T, K>` (`{ ok: true, data } | { ok: false, errorKey }`, `K` narrowed to this operation's keys) — never throws to the UI. Follow the `pxkit-service` skill when scaffolding a new boundary; `pxkit-form` when the feature includes a multi-field form.
- **Failures are SCREAMING_SNAKE `ErrorKey` literals** from `constants/error-keys.ts`, named by reason when known (`INVOICE_NOT_FOUND`), operation catch-all only when it isn't; copy resolves from the key at render time — no hardcoded user-facing strings anywhere in the feature.
- The feature composes shared UI primitives — it never redefines base UI, never reads `process.env` directly (typed `env.ts` only).

## 7. Coupling & abstraction — resist both

- **No speculative abstraction**: build for the journey in the plan, not imagined ones. Registry/factory patterns only at 3+ interchangeable variants; two known cases are a lookup map or `switch`.
- **No cross-feature reach-ins**: depend on shared layers or explicit entry points, never another feature's internals.
- A helper that needs a boolean flag to serve two callers is two functions — split it instead of parameterizing it.
- The test: would a senior engineer call this overcomplicated?

## 8. Verify

- Every journey step from phase 1 works end to end — including the empty, loading, and failure states.
- Done criteria hold: typecheck, lint, and tests pass (including the new ones on `lib/` logic).
- Every changed line traces back to the request — nothing opportunistic slipped in.
