# TypeScript

## interface vs type

- `interface` for object shapes (props, state, DTOs). `type` for unions, aliases, and function-derived types.
- Props interfaces are named `<Component>Props` — no `I` prefix, no `Props` alone.

```ts
interface SearchInputProps {
  placeholder: string;
  onSearch: (query: string) => void;
}

type Status = 'idle' | 'loading' | 'success' | 'error';
```

## Make invalid states boringly hard

- Model lifecycle as **one `status` union in a single state value** — booleans are derived from it, never stored beside it. Default to the bare union; escalate to a discriminated union only when the payload must be tied to the state:

```ts
// Bad — 8 combinations, most of them invalid
const [isLoading, setIsLoading] = useState(false);
const [isError, setIsError] = useState(false);
const [isSuccess, setIsSuccess] = useState(false);

// Good (default) — one bare union, one line
const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

// Escalate only when data/errorKey must be tied to the state
type State =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; data: Report }
  | { status: 'error'; errorKey: ErrorKey }; // typed keys — see errors.md
const [state, setState] = useState<State>({ status: 'idle' });
```

- Split entity shapes by lifecycle stage instead of making everything optional:

```ts
interface DraftUser {
  email: string;
  role: 'admin' | 'member';
}

interface SavedUser {
  id: string;
  email: string;
  role: 'admin' | 'member';
  status: 'active' | 'disabled';
}
```

## Unions and constants over enums

- String-literal unions for local domains (`type Placement = 'top' | 'bottom'`).
- For fixed token sets, use a `const` object + `as const` and derive the type — not `enum`:

```ts
export const uploadConfig = {
  image: { maxSizeMb: 5, accept: ['image/png', 'image/jpeg'] },
  document: { maxSizeMb: 20, accept: ['application/pdf'] },
} as const;

export type UploadKind = keyof typeof uploadConfig;
```

## Derive, don't restate

- Lean on utility types to derive from the source of truth: `keyof typeof`, `ReturnType<typeof useSearch>`, `Required<>`, `Omit<>`, `z.infer<typeof schema>`. Never hand-copy a shape that already exists somewhere else:

```ts
const searchSchema = z.object({
  query: z.string().min(1),
  page: z.number().int().positive(),
});
type SearchParams = z.infer<typeof searchSchema>; // never retyped by hand
```

- **Prefer inference over annotation — write the type only where it's a contract.** Don't restate what TS already infers: an initialized `const`, a callback parameter typed by its caller, a function whose return is obvious from its body. Annotate the things that *pin a contract* — function parameters, exported/boundary signatures, the domain shape a DTO mapper returns (so a wrong field errors at the mapper, not downstream) — and the spots where inference widens wrong (`as const`, an empty-array seed). Fewer types written, checked exactly as hard.
- `unknown` (never `any`) for open values: `Record<string, unknown>`. If `any` is truly unavoidable, disable the lint rule on that line with a comment saying why.
- Write type guards for narrowing instead of casting:

```ts
export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

const activeUsers = users.filter(isNotNull);
```

## Misc

- **Array syntax follows the repo.** `T[]` or `Array<T>` — match whatever the codebase already uses; never rewrite one into the other. It's a lint-autofix preference, not a convention, and flipping it repo-wide is pure churn.
- `readonly` on props/params where immutability is intended.
- Strict mode always (`strict: true`, `noExplicitAny` as an error).
- JSDoc exported functions/services where the contract isn't obvious from the signature — never `@param`/`@returns` lines that restate what the types already say.
