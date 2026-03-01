# Project Overview: payload-plugin-deepl-translate

## Purpose
Payload CMS v3 plugin for content translation via DeepL API (or custom adapters).
Package: `@marsender/payload-plugin-deepl-translate` (MIT, published to npm)

## Tech Stack
- TypeScript 5.x (strict mode, ESNext target)
- Node.js ≥ 18.20 / pnpm ≥ 9
- Payload CMS ^3.0.0 (peer), React ^19.0.0 (peer)
- deepl-node ^1.x (runtime dep), sonner (runtime dep, toasts)
- Vitest for testing, swc + tsc for build, ESLint + typescript-eslint for linting
- jiti in devDeps (required for ESLint TS config files)

## Codebase Structure
```
src/
  index.ts                   # Plugin factory: deeplTranslatePlugin(config)
  types.ts                   # PluginConfig, TranslatableField, etc.
  adapters/
    types.ts                 # TranslationAdapter interface
    deepl.ts                 # DeepLAdapter (wraps deepl-node, uppercases locale codes)
    index.ts
  endpoints/
    translateHandler.ts      # POST /api/translate handler
  components/
    TranslateButton/
      index.tsx              # 'use client' React component
      index.scss
  translations/
    index.ts
    types.ts
    languages/en.ts, fr.ts   # i18n namespace: plugin-deepl-translate
  utils/
    extractTranslatableFields.ts
    applyTranslations.ts
  exports/
    client.ts, translations.ts, types.ts  # Named entrypoints

tests/unit/                  # Vitest unit tests (20 tests passing, mocked SDKs)
tests/int/                   # Integration tests (require running Payload instance)
specs/001-deepl-translate-plugin/  # Spec, plan, tasks, research, data-model, contracts

.specify/
  memory/constitution.md     # Project constitution v1.0.0
  templates/                 # spec, plan, tasks, constitution templates
```

## Package Exports
| Export          | Purpose                                |
|-----------------|----------------------------------------|
| `.`             | Plugin factory (deeplTranslatePlugin)  |
| `./client`      | React client components (TranslateButton) |
| `./translations`| i18n messages (en, fr)                 |
| `./types`       | Exported TypeScript types              |

## Key Architectural Notes
- Adapter stored in `payload.config.custom.translateAdapter` at init
- Endpoint handler retrieves adapter from `payload.config.custom` — no direct imports
- DeepL locale codes MUST be UPPERCASE — adapter handles this automatically
- `useTranslation` hook: cast `t` as `(key: string) => string` for strict typing
- Plugin is side-effect free until `init()` called by Payload
