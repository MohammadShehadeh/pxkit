---
description: Build a form the house way — schema and error keys first, control chooser, Field/FieldGroup markup, RHF + zod, submit via Result-returning boundary
argument-hint: <form-name> [fields / purpose]
---

Build a form: $ARGUMENTS

Load the `pxkit-form` skill (and `pxkit-conventions` for errors/hooks when wiring submit). Work through phases 1–3 as the plan — no markup before confirmation.

## 1. Decide — form library or not

- **2+ fields, validation, or submit state** → RHF + zod (this command).
- **Single input** (search, inline rename) → plain state or form action; stop and say so if the ask is over-engineered.
- **Survey the repo**: existing forms, schema location, submit hooks, Field components — extend before inventing.

## 2. Schema & contract — before markup

- Export a **zod schema**; derive `type FormValues = z.infer<typeof schema>`.
- List every field, validation rule, and default value.
- Separate **field validation** (zod) from **submit failures** (`ErrorKey` literals for server/network).
- Add submit keys to `constants/error-keys.ts` before implementation.

**Present schema, fields, and error keys — wait for confirmation.**

## 3. Controls & layout

- Pick controls from the chooser in `pxkit-form` → `references/forms.md`.
- Plan `FieldGroup` / `Field` / `FieldSet` structure — no raw `div` + `space-y-*`.
- `'use client'` on the form component leaf only.

## 4. Build

- **Markup**: shadcn Field primitives; `data-invalid` + `aria-invalid` together; `InputGroup` for buttons-in-inputs.
- **Logic**: `useForm` + `zodResolver`, validation `mode` chosen deliberately (`onTouched` default, `onChange` only when a field needs per-keystroke feedback); double-submit guard via `form.formState.isSubmitting`.
- **Submit**: call service/action returning `Result<T, K>`; surface `{ ok: false, errorKey }` via toast or root error — never hardcoded strings.
- **Files**: kebab-case, colocated with feature; schema in `lib/`; no barrel `index.ts`.

## 5. Verify

- All field validation states render correctly.
- Submit: loading, success, and each planned `errorKey` path.
- Typecheck/lint pass; narrowed `Result<T, K>` at call site.
