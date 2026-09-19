# Core Principles

How to work, before any code is written.

## Adapt to the repo

These conventions describe a **house style**, not a mandate to reshape every project. Before adding files, packages, or patterns:

- **Read the existing layout** — route colocation vs `src/features/`, where UI primitives live, path aliases, test runner, env validation, i18n.
- **Match established patterns** when they already follow the spirit of these rules (direct imports, thin pages, service boundaries). Extend; do not parallel-invent.
- **Prefer the simplest home** for new code — a colocated feature folder beats a new package; a lookup map beats a registry until 3+ variants need it.
- **Use the project's toolchain** in plans and done criteria (`npm`/`pnpm`/`yarn`, whatever the repo already runs).

When a convention says "match the repo" or "the project's …", that overrides any example path or tool named here.

## Plan the change — in a large repo, planning *is* discovery

The bigger the codebase, the more the plan is a search, not a sketch. The expensive mistake at scale is re-inventing a shared layer that already lives three folders over — the fourth bespoke fetch wrapper, a second date formatter, a parallel error-key union. Before writing, locate:

- **The shared layers already in place** — the `http` client, `Result` + error-key union, data models / view builders, `format*` helpers, typed `env`. Reuse them; grep the alias, the type name, the endpoint. A second copy is the duplication that makes large repos rot.
- **The right home and the nearest sibling** — which feature owns this, and who already does something similar. Extend their pattern; do not parallel-invent. Colocate first, package only on a second consumer ([structure.md](structure.md)).
- **The blast radius** — if the change touches shared code, list its consumers first (grep the import path) and confirm the contract still holds for each before editing.
- **The steps** — break the work into surgical, independently verifiable changes, each tracing to the task; state the plan and confirm before coding.

In a small repo you hold all of this in your head; in a large one, skipping the discovery is exactly how the duplication got there.

## Working style

- **Be concise** in all interactions and commit messages.
- **Plan before coding.** State the approach and confirm it before writing code. Turn vague instructions into verifiable targets first: "add validation" becomes "write tests for invalid inputs, then make them pass."
- **Say "I don't know"** instead of guessing. If the request is ambiguous, ask. If you're confused, name what is unclear — do not pick one interpretation and run.
- **Push back** when a simpler approach exists. State assumptions out loud.

## Code philosophy

- **Simplicity first.** Write the minimum code that solves the problem. No speculative abstractions. No flexibility nobody asked for. The test: would a senior engineer call this overcomplicated?
- **Surgical changes.** Touch only what the task requires. Do not improve neighboring code. Do not refactor what is not broken. Every changed line should trace back to the request.
- **Return early instead of building conditional mazes.** Validate and bail at the top; keep the happy path unindented. Avoid `else` when a guard clause works.
- **Name the business meaning, not the technical accident.** `isEligibleForRenewal`, not `checkFlag2`.
- **Separate decisions from actions.** Pure functions decide; thin imperative shells act. Decision logic should be testable without mocking I/O.
- **Make errors useful to the next person.** An error message should say what failed, where, and with what input — see [errors.md](errors.md).
- **Single source of truth.** Do not introduce duplicated state, configuration, or mappings that require updating multiple files for the same change. Prefer deriving values dynamically from existing sources over maintaining manual synchronization points.
