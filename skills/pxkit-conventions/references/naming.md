# Naming Conventions

## Files

- **kebab-case for every filename**, components included: `button.tsx`, `use-upload-file.ts`, `what-i-do.tsx`. Never PascalCase filenames, even when the export is PascalCase.
- One *public* component/hook per file; the filename mirrors it (`input-field.tsx` → `InputField`, `use-countdown.ts` → `useCountdown`). The file also holds everything private to that export — sub-components, its props interface, constants, helpers. "One per file" limits what is exported, not what is declared (see [components.md](components.md)).
- `.tsx` if and only if the file contains JSX — a hook with JSX is `.tsx`, a hook without is `.ts`. In workspace packages, hooks are logic-only `.ts` — anything returning JSX moves to `components/`, because wildcard subpath exports resolve one extension per directory (see [structure.md](structure.md)).
- **No barrel files, no re-export middlemen.** Never create an `index.ts` that only re-exports, and never import a symbol into a file just to export it again (or alias it) so that consumers import it from there. Every symbol is imported from the file that defines it:

```ts
// Good
import { useUploadFile } from '@/hooks/use-upload-file';
import { http } from '@/lib/http';

// Bad — barrel indirection
import { useUploadFile } from '@/hooks';

// Bad — middleman: lib/api.ts imports http only to hand it on
import { http } from './http';
export { http };
export const apiClient = http;
// …and consumers now import { http } from '@/lib/api'
```

  A middleman adds a file to every trace and hides where the symbol really lives. The one re-export that earns its place is a file that *adds* something the source lacks — `components/motion.tsx` adding `'use client'` to a library export (see [nextjs.md](nextjs.md)). A re-export that adds nothing is deleted.

## Identifiers

- **camelCase** for variables and functions; **PascalCase** for components, types, and interfaces.
- **Booleans read as questions**: prefix `is` / `has` / `should` — `isLoading`, `isDragActive`, `hasNewStep`, `shouldBlock`. Derived flags follow the same rule (`isFirstStep`, `isModalStep`).
- **Event handlers** are `handle*` internally (`handleFileSelect`, `handleDragOver`); **callback props** are `on*` (`onUploadComplete`, `onUploadError`).
- **Name the business meaning, not the technical accident.** `isEligibleForRenewal`, `calculateDiscount`, `evaluateVisibility` — not `checkFlag2`, `doAction`, `checkExpr`.
- SCREAMING_SNAKE_CASE for wire-stable constants: error keys are SCREAMING literals from the `ErrorKey` union (`'UPLOAD_FILE_TOO_LARGE'` — see [errors.md](errors.md)); non-error copy constants (single-language apps without i18n) live in `constants/messages.ts`, referenced by symbol, never repeated as literals. Error copy is never a constant string — it resolves from the key at render time.
