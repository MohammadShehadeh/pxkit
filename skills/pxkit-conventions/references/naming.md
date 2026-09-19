# Naming Conventions

## Files

- **kebab-case for every filename**, components included: `button.tsx`, `use-upload-file.ts`, `what-i-do.tsx`. Never PascalCase filenames, even when the export is PascalCase.
- One primary component/hook per file; the filename mirrors the export (`input-field.tsx` → `InputField`, `use-countdown.ts` → `useCountdown`).
- `.tsx` if and only if the file contains JSX — a hook with JSX is `.tsx`, a hook without is `.ts`. In workspace packages, hooks are logic-only `.ts` — anything returning JSX moves to `components/`, because wildcard subpath exports resolve one extension per directory (see [structure.md](structure.md)).
- **No barrel files.** Never create an `index.ts` that only re-exports. Import directly from the file that defines the symbol:

```ts
// Good
import { useUploadFile } from '@/hooks/use-upload-file';

// Bad — barrel indirection
import { useUploadFile } from '@/hooks';
```

## Identifiers

- **camelCase** for variables and functions; **PascalCase** for components, types, and interfaces.
- **Booleans read as questions**: prefix `is` / `has` / `should` — `isLoading`, `isDragActive`, `hasNewStep`, `shouldBlock`. Derived flags follow the same rule (`isFirstStep`, `isModalStep`).
- **Event handlers** are `handle*` internally (`handleFileSelect`, `handleDragOver`); **callback props** are `on*` (`onUploadComplete`, `onUploadError`).
- **Name the business meaning, not the technical accident.** `isEligibleForRenewal`, `calculateDiscount`, `evaluateVisibility` — not `checkFlag2`, `doAction`, `checkExpr`.
- SCREAMING_SNAKE_CASE for wire-stable constants: error keys are SCREAMING literals from the `ErrorKey` union (`'UPLOAD_FILE_TOO_LARGE'` — see [errors.md](errors.md)); non-error copy constants (single-language apps without i18n) live in `constants/messages.ts`, referenced by symbol, never repeated as literals. Error copy is never a constant string — it resolves from the key at render time.
