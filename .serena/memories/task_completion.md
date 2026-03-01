# Task Completion Checklist

When a coding task is completed, always run these in order:

1. `pnpm type-check` — TypeScript MUST pass (no errors)
2. `pnpm lint` — ESLint MUST pass (use `pnpm lint:fix` to auto-fix)
3. `pnpm test` — All 20+ unit tests MUST pass
4. `pnpm build` — Build MUST succeed before committing/publishing

## Adding a New Adapter
1. Create `src/adapters/<provider>.ts` implementing `TranslationAdapter`
2. Handle locale code normalisation inside the adapter
3. Export factory from adapter file
4. Add unit tests in `tests/unit/<provider>.test.ts` with mocked SDK (no live API calls)
   - Integration tests (if any) go in `tests/int/<provider>.test.ts`
5. Update README with usage example

## Adding New UI Text
1. Add keys to `src/translations/languages/en.ts` AND `src/translations/languages/fr.ts`
2. Use namespace `plugin-deepl-translate`

## Adding New Public Types
1. Add to `src/types.ts` or relevant module
2. Re-export from `src/exports/types.ts` if part of public API
3. Verify explicit return types on all exported functions
