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
- Structured as an ESM package, same pattern as `payload-plugin-ecommerce`

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

## API Reference

### `deeplTranslatePlugin(config)`

| Option        | Type                 | Required    | Description                                            |
| ------------- | -------------------- | ----------- | ------------------------------------------------------ |
| `collections` | `CollectionSlug[]`   | Yes         | Collection slugs that get the Translate button         |
| `deeplApiKey` | `string`             | Conditional | DeepL API key (mutually exclusive with `adapter`)      |
| `adapter`     | `TranslationAdapter` | Conditional | Custom adapter (mutually exclusive with `deeplApiKey`) |
| `disabled`    | `boolean`            | No          | When true, plugin is a no-op                           |

### `TranslationAdapter` interface

```typescript
interface TranslationAdapter {
  translate(text: string, sourceLang: string, targetLang: string): Promise<string>
}
```

### REST Endpoint

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

## Troubleshooting

| Symptom                              | Fix                                                                               |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| Translate button not visible         | Add collection slug to `collections` in plugin config, or save the document first |
| "Translation adapter not configured" | Add `deeplApiKey` or `adapter` to plugin config                                   |
| HTTP 429 from DeepL                  | Rate limit or monthly quota exceeded — wait and retry, or upgrade DeepL plan      |
| Fields not translated                | Ensure fields have `localized: true` in the collection config                     |

## License

MIT
