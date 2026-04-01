# payload-plugin-deepl-translate Development Guidelines

**Package**: `@marsender/payload-plugin-deepl-translate` v3.80.0
**Last updated**: 2026-03-31

## Active Technologies

| Tool | Version |
|------|---------|
| TypeScript | ^5.9.3 |
| Node.js | ^18.20.2 \|\| >=20.9.0 |
| pnpm | ^9 \|\| ^10 |
| payload | ^3.0.0 (peer) |
| @payloadcms/ui | ^3.0.0 (peer) |
| @payloadcms/translations | ^3.0.0 (peer) |
| react / react-dom | ^19.0.0 (peer) |
| deepl-node | ^1.14.0 (runtime dep) |
| vitest | ^3.1.2 |
| SWC | ^1.15.8 |

## Project Structure

```text
src/
  index.ts                          # Plugin factory: deeplTranslatePlugin(config)
  types.ts                          # PluginConfig, TranslatableField, TranslationRequest, TranslationResponse
  adapters/
    types.ts                        # TranslationAdapter interface { translate(text, source, target) }
    deepl.ts                        # DeepLAdapter — wraps deepl-node SDK, retry/backoff, uppercase locales
    index.ts                        # Re-exports DeepL adapter
  endpoints/
    translateHandler.ts             # POST /api/translate
    translateCheckHandler.ts        # GET /api/translate-check (tenant filter evaluation)
  exports/
    client.ts                       # Client-side exports (TranslateButton, TranslateButtonWrapper)
    translations.ts                 # Plugin i18n strings export
    types.ts                        # Public type re-exports
  translations/
    index.ts                        # Translation registry (locale → language object)
    types.ts                        # Translation schema types
    languages/
      en.ts                         # English strings
      fr.ts                         # French strings
  utils/
    extractTranslatableFields.ts    # Recursively extracts localized text/textarea/richText fields
    applyTranslations.ts            # Applies translated strings back via dot-notation paths
tests/
  unit/
    deepl-adapter.test.ts           # DeepLAdapter: locale formatting, API calls, retry logic
    applyTranslations.test.ts       # Dot-notation injection, Lexical node updates, system field removal
    extractTranslatableFields.test.ts # Extraction from groups, arrays, blocks, tabs
  int/
    translateHandler.test.ts        # Full POST /api/translate flow
specs/
  001-deepl-translate-plugin/       # Original plugin specification
  002-fix-translation-logic/        # Translation logic fix specification
```

## Package Exports

| Export path | Entry point | Contents |
|------------|-------------|----------|
| `.` | `dist/index.js` | `deeplTranslatePlugin` factory |
| `./client` | `dist/exports/client.js` | React client components |
| `./translations` | `dist/exports/translations.js` | i18n strings |
| `./types` | `dist/exports/types.js` | Public TypeScript types |

## Commands

```bash
# Type-check (src + tests)
pnpm type-check

# Build (copyfiles → tsc declarations → swc)
pnpm build

# Lint
pnpm lint
pnpm lint:fix

# Tests
pnpm test           # all tests
pnpm test:unit      # tests/unit only
pnpm test:int       # tests/int only

# Clean build artifacts
pnpm clean
```

## Build Pipeline

`pnpm build` runs three steps in order:
1. **copyfiles** — rsync static assets (html, css, svg, fonts, json…) from `src/` to `dist/`
2. **build:types** — `tsc --emitDeclarationOnly` → `.d.ts` files in `dist/`
3. **build:swc** — `swc ./src -d ./dist` → fast transpilation of TS to ESM JS

## Key Architecture

### Adapter Pattern
`TranslationAdapter` interface (`src/adapters/types.ts`) is the pluggable contract. DeepL is the built-in adapter. Users can supply their own via `adapter:` config key.

### Plugin Init (`src/index.ts`)
- Stores adapter + config in `payload.config.custom.translateAdapter` (server-side, avoids serialization issues)
- Registers two endpoints: `POST /api/translate` and `GET /api/translate-check`
- Merges i18n namespace `plugin-deepl-translate` (en + fr)
- Injects `TranslateButtonWrapper` (RSC) into the admin UI for configured collections

### Server Component Wrapper
`TranslateButtonWrapper` is a React Server Component that runs `tenantFilter` server-side, then passes an `allowed` prop to the `'use client'` `TranslateButton`.

### Lexical Rich Text
Fields extracted/applied via tree-path notation. Text node content is translated; links/URLs are preserved and never translated.

### DeepL Locale Codes
- Payload uses lowercase codes (e.g. `en`, `fr`)
- DeepL API requires UPPERCASE (e.g. `EN`, `FR`, `EN-US`)
- Source codes: regional variant stripped (`en-US` → `EN`)
- Target codes: regional variant preserved (`en-US` → `EN-US`)
- `localeMapping` option lets users override specific codes before this normalization

### Tenant Filtering
Optional `tenantFilter: (tenantId: string | null) => boolean | Promise<boolean>` evaluated server-side. Returns `true` = show button. Configured with optional `tenantField` (defaults to `'tenant'`).

## Important Implementation Details

- `useTranslation` from `@payloadcms/ui` has strict typing — cast `t` as `(key: string) => string`
- `jiti` is a devDep required by ESLint to load `eslint.config.ts` (TypeScript flat config)
- `sonner` is NOT a dependency — toast notifications use Payload's built-in notification system
- TypeScript strict mode is enabled; no `any` without explicit suppression
- ESLint flat config (`eslint.config.ts`): typescript-eslint recommended + custom rules

## Development Workflow

```bash
# Fresh install (e.g. after upgrading Payload version)
pnpm store prune
rm -rf node_modules && rm pnpm-lock.yaml
pnpm install

# Upgrade Payload peer deps
pnpm update payload@<version> @payloadcms/ui@<version> @payloadcms/translations@<version>

# Full validation before commit
pnpm type-check && pnpm build && pnpm test && pnpm lint

# Commit and tag release
git add .
git commit -m "<message>"
git push
git tag v<version>
git push origin v<version>
```

## Reference Projects

- Structure pattern: `/opt/git/marsender/payload-plugin-ecommerce/`
- Original reference plugin: `/home/marsender/Projects/Marsender/lemodule/payload-translate/`
- Spec documents: `specs/001-deepl-translate-plugin/` and `specs/002-fix-translation-logic/`

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
