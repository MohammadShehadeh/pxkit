---
name: pxkit-form
description: Build or extend a form the pxkit way — zod schema and error keys first, react-hook-form logic, shadcn Field/FieldGroup markup, a control chooser, and submit through a Result-returning action or service. Use whenever the user asks for a form, sign-up/login/checkout/contact/settings screen, input validation, a multi-step wizard, or a submit flow, and whenever a task adds two or more inputs that get submitted together — even if they only say "add a couple of fields".
---

# pxkit Form

End-to-end form recipe. Markup and control rules in [references/forms.md](references/forms.md). Load `pxkit-conventions` for errors, components, and hooks-state when wiring submit.

## Gates

- **Schema and error keys before any markup.** Markup written first gets retrofitted to the schema and the two drift; the schema written first drives the type, the fields, the resolver, and the server validation from one source.
- **Present step 2 and wait for confirmation** before building UI.
- **No raw `div` + `space-y-*` form markup** when the project has Field primitives; the primitives carry the invalid/disabled styling and the label wiring.
- **No hardcoded user-facing error strings.** Submit failures render from an `errorKey` resolved at render time.
- **No thrown error crosses from the boundary into the form.** The submit handler consumes `Result`, never `try/catch`-and-toast.

## 1. Decide — form library or not

| Situation | Approach |
| --- | --- |
| 2+ fields, validation rules, or submit state | **RHF + zod** — follow this skill |
| Single uncontrolled input (search, inline rename) | Plain state or a form action; no form library |

Inspect the repo: reuse an existing form pattern, schema location, and submit hook before inventing a parallel one. If the ask is a single input, say so and stop; a form library for one field is over-engineering.

## 2. Schema first

- Export a **zod schema** colocated with the feature (`lib/` or next to the form component).
- Derive the form type: `type CheckoutFormValues = z.infer<typeof checkoutSchema>`.
- List **validation failures** (field-level, from zod) and **submit failures** (server/network) separately; they render in different places.
- Submit failures are SCREAMING_SNAKE `ErrorKey` literals added to the feature's `constants/error-keys.ts` before wiring submit, named by reason when known (`CONTACT_RATE_LIMITED`), operation catch-all only otherwise (`pxkit-conventions`: `errors` rule).

**Present the schema, the field list with defaults, and the error keys.** Wait for confirmation.

## 3. Choose controls

Reuse shadcn/ui primitives from the project's UI layer:

| Need | Control |
| --- | --- |
| Simple text | `Input` |
| Dropdown, predefined options | `Select` |
| Searchable dropdown | `Combobox` |
| Boolean in settings | `Switch` |
| Boolean in a form | `Checkbox` |
| Single choice, few options | `RadioGroup` |
| Toggle between 2–5 options | `ToggleGroup` |
| Multi-line text | `Textarea` |
| OTP / verification code | `InputOTP` |

Buttons inside inputs: `InputGroup` + `InputGroupAddon` (with `InputGroupInput`, not raw `Input`). Related checkboxes/radios: `FieldSet` + `FieldLegend`.

## 4. Markup — FieldGroup / Field

- `'use client'` on the form component leaf only.
- Wrap fields in `FieldGroup` → `Field` → `FieldLabel` + control + optional `FieldDescription`; field errors in `FieldError`.
- Invalid/disabled need both attributes: **`data-invalid` / `data-disabled` on `Field`** (styles label and description) and **`aria-invalid` / `disabled` on the control** (styles the control and informs assistive tech).
- Connect RHF with `register` or `Controller`; match what the repo already uses.
- Submit errors render from `errorKey` at display time.

```tsx
<FieldGroup>
  <Field data-invalid={!!errors.email}>
    <FieldLabel htmlFor="email">Email</FieldLabel>
    <Input id="email" type="email" aria-invalid={!!errors.email} {...register('email')} />
    <FieldDescription>We only use this to send your receipt.</FieldDescription>
    {errors.email ? <FieldError>{errors.email.message}</FieldError> : null}
  </Field>
</FieldGroup>
```

## 5. Logic — useForm + submit

```ts
const form = useForm<CheckoutFormValues>({
  defaultValues,
  mode: 'onTouched', // onChange only when a field needs per-keystroke feedback
  resolver: zodResolver(checkoutSchema),
});
```

- `onTouched` validates after first blur and then live, so the form doesn't shout while the user is still typing. Choose `onChange` deliberately, per field need.
- Guard double-submit with a per-button async hook (`{ isProcessing, execute }`) or `form.formState.isSubmitting`; not a hand-managed disabled flag.
- The submit handler calls a **service or server action** returning `Result<T, K>` (`pxkit-service` when the boundary doesn't exist yet).
- On `{ ok: false, errorKey }`: set root error state or toast from resolved copy (``t(`errors.${errorKey}`)`` / `errorCopy[errorKey]`). On `{ ok: true }`: reset or redirect per the journey.

## 6. File layout

Colocate with the feature (route folder or `features/<name>/`):

```
components/checkout-form.tsx    # 'use client' — markup + useForm
lib/checkout-schema.ts          # zod schema + z.infer type (or schema next to form if tiny)
actions/submit-checkout.ts      # 'use server' — thin shell → service
services/checkout.ts            # external call, DTO map, Result return
constants/error-keys.ts         # CheckoutErrorKey union
```

Kebab-case filenames, named arrow-const export, no barrel `index.ts`.

## 7. Verify

- Every field validates per schema; the invalid state shows on the correct `Field` with both attributes set.
- Submit renders loading/disabled while processing, then success and **each** `errorKey` path from step 2.
- `rg "toast\(|toast\.error\(" <form files>` shows only resolved copy, never a string literal.
- `rg "space-y-" <form files>` returns nothing inside form markup.
- Typecheck passes with the narrowed `Result<T, K>` at the call site.
- Final test: would a senior engineer call this overcomplicated?
