import * as deepl from 'deepl-node'

import type { TranslationAdapter } from './types.js'

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < maxRetries) {
        const delay = 500 * 2 ** attempt // 500ms, 1000ms, 2000ms
        console.warn(
          `[DeepLAdapter] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
          err instanceof Error ? err.message : String(err),
        )
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }
  throw lastError
}

/**
 * Built-in translation adapter using the DeepL API.
 * Translates one string per call using the official deepl-node SDK.
 * The SDK automatically routes to the Free or Pro endpoint based on the key suffix.
 */
export class DeepLAdapter implements TranslationAdapter {
  private client: deepl.DeepLClient

  constructor(apiKey: string) {
    this.client = new deepl.DeepLClient(apiKey)
  }

  async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
    // DeepL source languages never accept regional variants (e.g. 'EN-US' is invalid as source).
    // Strip the subtag so 'en-US' → 'EN', 'fr-FR' → 'FR', etc.
    // Target languages may have regional variants: 'EN-US', 'PT-BR', 'ZH-HANS' are all valid.
    // Use the plugin's `localeMapping` to map targets that need regional variants:
    //   localeMapping: { en: 'en-US', pt: 'pt-BR' }
    const [baseLang] = sourceLang.toUpperCase().split('-')
    const source = baseLang as deepl.SourceLanguageCode
    const target = targetLang.toUpperCase() as deepl.TargetLanguageCode

    const result = await withRetry(() => this.client.translateText(text, source, target))
    return result.text
  }
}

/**
 * Convenience factory for consumers who prefer functional style.
 */
export function createDeepLAdapter(apiKey: string): TranslationAdapter {
  return new DeepLAdapter(apiKey)
}
