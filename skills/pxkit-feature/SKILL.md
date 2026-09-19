---
name: pxkit-feature
description: Scaffold or extend a feature module the pxkit way — colocated route or feature folder by default, responsibility-based directories, direct imports, and a shared package only when 2+ consumers exist. Use whenever the user asks to add a feature, module, domain area, "section of the app", or to add hooks/actions/services to an existing one, and whenever a task would create a new folder under app/, features/, or packages/ — even if they don't say "feature".
---

# pxkit Feature Module

How a feature is structured and where it lives. Full detail in [references/structure.md](references/structure.md). Load `pxkit-conventions` for everything inside the module (components, hooks, boundaries, errors).

## Gates

- **No files before step 1 is answered from the repo**, not from habit. A second layout pattern in one repo is a permanent tax on every reader.
- **No package for a single consumer.** A package is a versioning and build commitment; colocated code can be extracted later in an hour, the reverse takes a week.
- **No `index.ts` anywhere in the module.** Barrels hide server/client boundaries and turn "where is this defined" into a two-jump question.
- **Present the layout (step 2) and the import paths (step 3) before creating files** when the feature is new. Wait for confirmation.

## 1. Pick the feature's home

Inspect the repo first and match its existing pattern:

| Situation | Home |
| --- | --- |
| **Default** — single app, one consumer | **Feature-colocated** — route folder under `app/` *or* `src/features/<name>/`, whichever the repo already uses |
| Shared by 2+ apps or versioned independently | **Package** — npm package or monorepo workspace member |

Evidence to cite when choosing: an existing sibling feature's path, the alias config, the workspace config if any.

## 2. Layout — create only what you need

```
<feature-home>/
  components/   # arrow-const components, kebab-case files
  hooks/        # use-*.ts — logic only; object returns with status + errorKey
  actions/      # 'use server' — return { ok, data | errorKey }
  services/     # external calls, DTO → internal mapping
  types/
  constants/    # error-keys.ts, config.ts (as const + keyof typeof)
  lib/          # pure logic — colocate *.test.ts here
```

Add a directory only when a file exists for it. An empty `types/` or `constants/` folder is noise that invites misplaced files.

## 3. Imports

Consumers import the **defining file** via the project's path alias:

```ts
import { useUploadFile } from '@/features/upload/hooks/use-upload-file';
import { Dropzone } from '@/features/upload/components/dropzone';
```

Other features never reach into this module's internals beyond these public files; cross-feature needs go through shared layers.

## 4. Package boundary — only when extracted

When the feature becomes a shared package, expose wildcard per-file subpath exports so every file stays individually importable with no barrel:

```jsonc
{
  "name": "@scope/upload",
  "type": "module",
  "sideEffects": false,
  "exports": {
    "./components/*": { "types": "./dist/components/*.d.ts", "default": "./src/components/*.tsx" },
    "./hooks/*":      { "types": "./dist/hooks/*.d.ts",      "default": "./src/hooks/*.ts" },
    "./actions/*":    { "types": "./dist/actions/*.d.ts",    "default": "./src/actions/*.ts" }
  }
}
```

Wildcards resolve one extension per directory, so `hooks/`, `actions/`, `services/`, `lib/` stay `.ts` and JSX lives only in `components/`. Follow the repo's package naming, build output paths, and workspace dependency conventions; do not introduce a monorepo layout into a single-package app.

## 5. Patterns inside the module

- Compose the project's shared UI layer; never redefine base primitives.
- User-facing copy via the project's i18n (or an exhaustive key → string map); failures as SCREAMING_SNAKE `ErrorKey` literals from `constants/error-keys.ts` (`pxkit-conventions`: `errors` rule).
- Extensible systems (3+ interchangeable variants): registry pattern — definitions → Map registry → factory → renderer. Two known cases: a lookup map or `switch`, which stays greppable.
- Cross-cutting API checks: higher-order wrappers (`export const POST = withAuth(handleCreateOrder)`) when the repo already uses that pattern.
- Everything else per `pxkit-conventions`.

## 6. Verify

Run before reporting done; each check has a command so it cannot be hand-waved.

- `rg --files <feature-home> | rg "index\.ts$"` returns nothing.
- `rg "export default" <feature-home>` matches only Next.js file conventions.
- `rg --files <feature-home>` shows only kebab-case names and no empty directories.
- No import in the rest of the app reaches into `<feature-home>` beyond `components/`, `hooks/`, `actions/`, `services/` files.
- The repo's `typecheck`, `lint`, and `test` scripts pass.
