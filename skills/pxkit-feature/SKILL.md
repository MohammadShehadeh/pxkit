---
name: pxkit-feature
description: Scaffold or extend a feature module the pxkit way — colocated route or feature folder by default, responsibility-based directories, direct imports, and a shared package only when 2+ consumers exist. Use whenever the user asks to add a feature, module, domain area, "section of the app", or to add hooks/actions/services to an existing one, and whenever a task would create a new folder under app/, features/, or packages/ — even if they don't say "feature".
---

# pxkit Feature Module

How a feature is structured and where it lives. Full detail in [references/structure.md](references/structure.md). Load `pxkit-conventions` for everything inside the module (components, hooks, boundaries, errors).

## Gates

- **No files before step 1 is answered from the repo.** A second layout pattern in one repo costs every reader forever.
- **No package for a single consumer.** Colocated code can be extracted later; a package is a build and versioning commitment.
- **No `index.ts` anywhere in the module.** A barrel turns "where is this defined" into a two-jump question.
- **No shared helper inside the module until it has two identical callers.** Duplicate the small pure thing first.
- **Present the layout (step 2) before creating files** for a new feature. Wait for confirmation.

## 1. Pick the feature's home

Inspect the repo and match its existing pattern (a sibling feature's path, the alias config, the workspace config):

| Situation | Home |
| --- | --- |
| **Default** — single app, one consumer | **Feature-colocated** — route folder under `app/` *or* `src/features/<name>/`, whichever the repo already uses |
| Shared by 2+ apps or versioned independently | **Package** — npm package or monorepo workspace member |

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

Add a directory only when a file exists for it.

## 3. Imports

Consumers import the **defining file** via the project's path alias:

```ts
import { useUploadFile } from '@/features/upload/hooks/use-upload-file';
import { Dropzone } from '@/features/upload/components/dropzone';
```

Other features import these files directly too; there is no second, "public" layer. Cross-feature logic goes to a shared layer, not into another feature's folder.

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

Wildcards resolve one extension per directory: `hooks/`, `actions/`, `services/`, `lib/` stay `.ts`; JSX lives only in `components/`. Follow the repo's package naming, build output paths, and workspace conventions; do not introduce a monorepo layout into a single-package app.

## 5. Patterns inside the module

- Compose the project's shared UI layer; never redefine base primitives.
- User-facing copy via the project's i18n (or an exhaustive key → string map); failures as SCREAMING_SNAKE `ErrorKey` literals from `constants/error-keys.ts` (`pxkit-conventions`: `errors` rule).
- Two known cases: a lookup map or `switch`. A registry (definitions → Map → factory → renderer) only at 3+ interchangeable variants or when external code must register them.
- Cross-cutting API checks: higher-order wrappers (`export const POST = withAuth(handleCreateOrder)`) when the repo already uses that pattern.
- Everything else per `pxkit-conventions`.

## 6. Verify

- `rg --files <feature-home> | rg "index\.ts$"` returns nothing.
- `rg "export default" <feature-home>` matches only Next.js file conventions.
- `rg --files <feature-home>` shows only kebab-case names and no empty directories.
- Any file in the module can be understood by opening at most one other file.
- The repo's `typecheck`, `lint`, and `test` scripts pass.
