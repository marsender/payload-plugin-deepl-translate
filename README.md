# payload-plugin-deepl-translate

DeepL translation plugin for Payload CMS with configurable adapter support.

Adds a **Translate** button to document edit views in the Payload admin panel. Clicking it opens a locale selector (all non-current locales pre-selected), and translates all localized fields field-by-field using DeepL or a custom translation adapter.

## Features

- One-click translation from the Payload admin panel
- All target locales pre-selected by default — deselect the ones you don't need
- Translates text, textarea, and rich text (Lexical) fields
- Recursive discovery of localized fields in groups, arrays, blocks, and tabs
- DeepL adapter built-in; bring your own adapter for any other provider
- Full i18n support — plugin UI labels available in English and French
- Preserves URLs and hyperlinks in rich text (never translated)
- Translate button is disabled while there are unsaved changes — prevents translating a stale version of the document
- Translate button turns red while a translation is in progress — visual cue to wait before navigating away
- Per-tenant filtering via a server-side `tenantFilter` function — hide the button for tenants whose billing plan does not include translation
- Structured as an ESM package, same pattern as `payload-plugin-ecommerce`

## Zero database footprint

This plugin makes no changes to your database. It does not create collections, add fields, or modify your schema in any way. All translation work happens at request time: the plugin reads the source document, calls the translation API, and writes the translated content back using the standard Payload `update` API — exactly as if you had typed the translations by hand.

## Installation

```bash
pnpm add github:marsender/payload-plugin-deepl-translate
```

## Setup

### 1. Add your DeepL API key to environment

```bash
# .env
DEEPL_API_KEY=your-deepl-api-key-here
```

### 2. Add the plugin to your Payload config

```typescript
// payload.config.ts
import { buildConfig } from 'payload'
import { deeplTranslatePlugin } from '@marsender/payload-plugin-deepl-translate'

export default buildConfig({
  localization: {
    locales: ['en', 'fr', 'de'],
    defaultLocale: 'en',
  },
  plugins: [
    deeplTranslatePlugin({
      collections: ['pages', 'posts'],
      deeplApiKey: process.env.DEEPL_API_KEY,
    }),
  ],
})
```

### 3. Mark fields as localized

```typescript
// In your collection config
{
  name: 'title',
  type: 'text',
  localized: true,  // ← required for the plugin to include this field
}
```

### 4. Restart and translate

Open any document in a configured collection, click **Translate**, adjust the locale selection if needed, and confirm.

## Tenant Filtering

Use `tenantFilter` to show or hide the Translate button based on any server-side rule — typically whether a tenant's billing plan includes the translation feature.

The function receives the tenant ID extracted from the document's `tenant` field (or whatever field you specify with `tenantField`). Return `true` to show the button, `false` to hide it. Async functions are fully supported.

```typescript
// payload.config.ts
import { buildConfig, getPayload } from 'payload'
import { deeplTranslatePlugin } from '@marsender/payload-plugin-deepl-translate'
import config from './payload.config'

export default buildConfig({
  plugins: [
    deeplTranslatePlugin({
      collections: ['pages', 'posts'],
      deeplApiKey: process.env.DEEPL_API_KEY,

      // Name of the document field that holds the tenant relationship.
      // Defaults to 'tenant' — omit this line if your field is already named 'tenant'.
      tenantField: 'tenant',

      // Called server-side each time a document is opened in the admin panel.
      // tenantId is the raw ID of the related tenant, or null if the field is empty.
      tenantFilter: async (tenantId) => {
        if (!tenantId) return false
        const payload = await getPayload({ config })
        const tenant = await payload.findByID({
          collection: 'tenants',
          id: tenantId,
          depth: 0,
        })
        // Show the button only for tenants whose plan includes translation
        return tenant?.plan === 'premium' || tenant?.features?.translation === true
      },
    }),
  ],
})
```

When `tenantFilter` is omitted, the Translate button is visible for all tenants.

## Using a Custom Adapter

Implement the `TranslationAdapter` interface to use any translation provider:

```typescript
import type { TranslationAdapter } from '@marsender/payload-plugin-deepl-translate/types'

const googleAdapter: TranslationAdapter = {
  async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
    // your implementation here
    return translatedText
  },
}

deeplTranslatePlugin({
  collections: ['pages'],
  adapter: googleAdapter,
})
```

## Locale Mapping

Some translation providers require more specific locale codes than what Payload uses. For example, DeepL deprecated `en` as a target language and requires `en-GB` or `en-US` instead.

Use the `localeMapping` option to map Payload locale codes to provider-specific ones:

```typescript
deeplTranslatePlugin({
  collections: ['pages', 'posts'],
  deeplApiKey: process.env.DEEPL_API_KEY,
  localeMapping: {
    en: 'en-US', // or 'en-GB'
    pt: 'pt-BR', // or 'pt-PT'
  },
})
```

The mapping applies to both source and target locales. Unmapped locales are passed through unchanged.

## API Reference

### `deeplTranslatePlugin(config)`

| Option          | Type                                                        | Required    | Description                                                                                              |
| --------------- | ----------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `collections`   | `CollectionSlug[]`                                          | Yes         | Collection slugs that get the Translate button                                                           |
| `deeplApiKey`   | `string`                                                    | Conditional | DeepL API key (mutually exclusive with `adapter`)                                                        |
| `adapter`       | `TranslationAdapter`                                        | Conditional | Custom adapter (mutually exclusive with `deeplApiKey`)                                                   |
| `disabled`      | `boolean`                                                   | No          | When true, plugin is a no-op                                                                             |
| `localeMapping` | `Record<string,string>`                                     | No          | Map Payload locale codes to provider-specific codes                                                      |
| `tenantFilter`  | `(tenantId: string \| null) => boolean \| Promise<boolean>` | No          | Server-side function to enable/disable the button per tenant (see [Tenant Filtering](#tenant-filtering)) |
| `tenantField`   | `string`                                                    | No          | Document field that holds the tenant relationship. Defaults to `'tenant'`                                |

### `TranslationAdapter` interface

```typescript
interface TranslationAdapter {
  translate(text: string, sourceLang: string, targetLang: string): Promise<string>
}
```

### REST Endpoints

`POST {serverURL}/api/translate`

```json
{
  "collection": "pages",
  "documentId": "abc123",
  "sourceLocale": "en",
  "targetLocales": ["fr", "de"]
}
```

Requires authenticated Payload session.

`GET {serverURL}/api/translate-check?collection=<slug>&id=<documentId>`

Returns `{ "allowed": true|false }`. Called automatically by the Translate button when `tenantFilter` is configured. Requires authenticated Payload session.

## Troubleshooting

| Symptom                               | Fix                                                                               |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| Translate button not visible          | Add collection slug to `collections` in plugin config, or save the document first |
| Translate button is greyed out        | The document has unsaved changes — save first, then translate                     |
| Translate button not visible (tenant) | The `tenantFilter` returned `false` for this document's tenant                    |
| "Translation adapter not configured"  | Add `deeplApiKey` or `adapter` to plugin config                                   |
| HTTP 429 from DeepL                   | Rate limit or monthly quota exceeded — wait and retry, or upgrade DeepL plan      |
| Fields not translated                 | Ensure fields have `localized: true` in the collection config                     |
| `targetLang='en' is deprecated`       | DeepL no longer accepts `en` as a target — use `localeMapping: { en: 'en-US' }`   |

## License

MIT
