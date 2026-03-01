# Code Style & Conventions

## TypeScript
- Strict mode enabled (`strict: true` in tsconfig.json)
- ESNext target, moduleResolution: bundler
- No `any` unless absolutely necessary and justified
- All exported types/functions MUST have explicit return types
- Import paths use `.js` extension (ESM)

## File Naming
- Source files: camelCase (e.g., `translateHandler.ts`, `applyTranslations.ts`)
- Test files: `*.test.ts` (currently), should be `*.spec.ts` per constitution
- React components: PascalCase directory with `index.tsx` (e.g., `TranslateButton/index.tsx`)

## Code Principles (from constitution)
- YAGNI: only add what is directly requested
- No premature abstractions — 3 similar lines > 1 premature helper
- No docstrings/comments on code you didn't change
- No error handling for impossible scenarios
- No feature flags or backwards-compat shims

## ESLint
- Config: `eslint.config.ts` using typescript-eslint recommended
- Rules: no-explicit-any (warn), no-unused-vars (warn, _ prefix to ignore), ban-ts-comment (warn)
- Ignored: `_`-prefixed vars/args/destructured arrays, `ignore`-prefixed caught errors

## React
- Client components: `'use client'` directive required
- Only exported via `./client` entrypoint
- i18n: `useTranslation` from `@payloadcms/ui`, cast `t` as `(key: string) => string`

## i18n
- Namespace: `plugin-deepl-translate`
- Languages: en, fr
- Add keys to both language files when adding new UI text
