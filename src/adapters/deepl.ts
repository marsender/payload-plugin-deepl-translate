import * as deepl from 'deepl-node'

import type { TranslationAdapter } from './types.js'

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

    const result = await this.client.translateText(text, source, target)
    return result.text
  }
}

/**
 * Convenience factory for consumers who prefer functional style.
 */
export function createDeepLAdapter(apiKey: string): TranslationAdapter {
  return new DeepLAdapter(apiKey)
}
