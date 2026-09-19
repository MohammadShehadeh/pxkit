# Testing & Tooling

## Testing

- Use the **repo's test runner** (Vitest + Testing Library is the house default when none is established). Tests are **colocated** `*.test.ts` siblings of what they test.
- Test the **pure logic** (parsers, mappers, schema generators, calculators) — the "decisions" half of decisions-vs-actions. Don't unit-test thin component wiring.
- BDD style: `describe('<subject>')` + `it('should ...')`.

## Tooling

- Match the repo's formatter/linter and pre-commit setup — run the same commands the project already uses in CI (`typecheck`, `lint`, `test`) as done criteria.
- House defaults when unset: single quotes, semicolons, 2-space indent, ~120 line width, `noExplicitAny` and unused imports/vars as errors, organized imports.
