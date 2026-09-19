# Forms

Form *logic* is react-hook-form + zod; form *markup* composes the shadcn field primitives (base-layer rules in [ui-composition.md](ui-composition.md)). Both halves live here.

## Logic

**When to use RHF + zod:** any form with 2+ fields, validation rules, or submit state. **When not:** a single uncontrolled input (search box, inline rename) — plain state or a form action is enough; a form library for one field is over-engineering.

- `react-hook-form` + `zodResolver`. Pick the validation `mode` deliberately: `onTouched` (validate after first blur, then live) is the sane default — it doesn't yell while the user is still typing. Reach for `onChange` only when a field genuinely needs per-keystroke feedback, knowing it revalidates on every keystroke. Validation schemas are exported zod schemas, centralized — form types derive via `z.infer`:

```ts
const form = useForm<CheckoutFormValues>({
  defaultValues,
  mode: 'onTouched',
  resolver: zodResolver(checkoutSchema),
});
```

- Guard double-submits with a per-button async-action hook (`{ isProcessing, execute }`), not disabled-flag spaghetti.
- Field and submit errors render from a typed `errorKey` resolved at render time — never hardcoded strings (see [errors.md](errors.md)).

## Markup

Form markup uses the library's field components — never raw `div`s with `space-y-*`:

```tsx
<FieldGroup>
  <Field>
    <FieldLabel htmlFor="email">Email</FieldLabel>
    <Input id="email" type="email" />
  </Field>
  <Field data-invalid>
    <FieldLabel htmlFor="password">Password</FieldLabel>
    <Input id="password" type="password" aria-invalid />
    <FieldDescription>Must be at least 12 characters.</FieldDescription>
  </Field>
</FieldGroup>
```

- **Group related checkboxes/radios/switches with `FieldSet` + `FieldLegend`** — not a `div` with a heading.
- **Validation and disabled need both attributes**: `data-invalid`/`data-disabled` styles the field (label, description); `aria-invalid`/`disabled` styles the control.
- **Buttons inside inputs use `InputGroup` + `InputGroupAddon`** — never a `Button` absolutely positioned over an `Input` with `pr-10` hacks. Inside an `InputGroup`, use `InputGroupInput`/`InputGroupTextarea`, not raw `Input`.
- **Option sets of 2–5 choices use `ToggleGroup`** — never a mapped `Button` list with hand-managed active state.

## Choosing form controls

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
| OTP/verification code | `InputOTP` |
