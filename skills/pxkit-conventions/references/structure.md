# Project & Feature Structure

## Adapt to the repo first

Before creating directories or packages, **inspect how this project is already organized** — route colocation vs top-level `features/`, path aliases, shared UI location, test runner. These rules describe a consistent house shape; match existing patterns when they already align. Do not restructure unrelated code to fit an example layout.

## No barrel files — anywhere

- Never create an `index.ts` whose job is re-exporting. Consumers import the defining file directly:

```ts
// Good
import { useUploadFile } from '@/features/upload/hooks/use-upload-file';
import { Dropzone } from '@/features/upload/components/dropzone';

// Bad
import { useUploadFile, Dropzone } from '@/features/upload';
```

Direct imports keep tree-shaking exact, keep server/client boundaries visible, and make "where is this defined" a one-jump question.

## Feature module (default)

A **feature module** groups one business capability by responsibility, not as a flat dump of unrelated files.

**Where it lives** — pick the home the repo already uses; do not invent a second pattern:

| Situation | Typical home |
| --- | --- |
| Next.js feature tied to one route area | Route-colocated folder under `app/` — owns `components/`, `hooks/`, `lib/`, etc. |
| Feature spans routes or isn't route-bound | `src/features/<name>/` (or the repo's equivalent) |
| Feature shared by 2+ apps or versioned independently | Extract to a package (see below) |

**Internal taxonomy** — slice by responsibility; add a directory only when a file exists to live there:

- `components/` — JSX; kebab-case files, named arrow-const exports
- `hooks/` — `use-*.ts` logic only; JSX stays in `components/`
- `actions/` — server mutations (`'use server'` in Next.js)
- `services/` — external I/O, DTO → internal mapping
- `types/`, `constants/` (e.g. `error-keys.ts`), `lib/` — pure logic; colocate `*.test.ts` here

Import via the project's path alias (`@/…`, `@feature/…`, etc.) — always the defining file, never a barrel.

## Shared package (optional)

**Only when** the feature has 2+ consumers or must ship/version independently. A single-app feature stays colocated — do not manufacture a package for one consumer.

Same internal taxonomy as above. The package boundary adds:

- **Wildcard per-file subpath exports** in `package.json` — every file individually importable, no barrels:

```jsonc
"exports": {
  "./components/*": { "types": "./dist/components/*.d.ts", "default": "./src/components/*.tsx" },
  "./hooks/*":      { "types": "./dist/hooks/*.d.ts",      "default": "./src/hooks/*.ts" },
  "./services/*":   { "types": "./dist/services/*.d.ts",   "default": "./src/services/*.ts" }
}
```

- Wildcard patterns resolve one extension per directory — keep `hooks/`, `services/`, `actions/`, `constants/`, `lib/` as `.ts`; JSX only in `components/` (`.tsx`). Split a hook that wants JSX: logic in `hooks/`, markup in `components/`.
- `"type": "module"`, `"sideEffects": false` when the repo uses ESM packages.
- **Monorepo extras** (only if the repo uses workspaces): scoped package name, internal deps via the workspace protocol, shared externals pinned in the root — follow whatever the monorepo already does; do not introduce workspaces into a single-package repo.

## Registry pattern (when warranted)

Extensible systems (dynamic forms, plugin-style renderers): plain definition objects → Map-backed registry → factory → type-to-component renderer. **When:** 3+ interchangeable variants, or external code must register capabilities. **When not:** two known cases — a lookup map or `switch` is simpler and stays greppable.

## App skeleton (Next.js)

Common single-app layout under `src/` (adjust to the repo): `app/`, `components/`, `lib/`, `hooks/`, `constants/`, `services/`, `providers/`, `styles/`, `types/`, typed `env.ts`. Feature-colocated route folders or `features/<name>/` own their slice; only genuinely cross-feature code is hoisted to top-level folders. Details in [nextjs.md](nextjs.md).
