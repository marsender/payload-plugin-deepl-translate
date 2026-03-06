import * as deepl from 'deepl-node';
/**
 * Built-in translation adapter using the DeepL API.
 * Translates one string per call using the official deepl-node SDK.
 * The SDK automatically routes to the Free or Pro endpoint based on the key suffix.
 */
export class DeepLAdapter {
    client;
    constructor(apiKey) {
        this.client = new deepl.DeepLClient(apiKey);
    }
    async translate(text, sourceLang, targetLang) {
        // DeepL source languages never accept regional variants (e.g. 'EN-US' is invalid as source).
        // Strip the subtag so 'en-US' → 'EN', 'fr-FR' → 'FR', etc.
        // Target languages may have regional variants: 'EN-US', 'PT-BR', 'ZH-HANS' are all valid.
        // Use the plugin's `localeMapping` to map targets that need regional variants:
        //   localeMapping: { en: 'en-US', pt: 'pt-BR' }
        const [baseLang] = sourceLang.toUpperCase().split('-');
        const source = baseLang;
        const target = targetLang.toUpperCase();
        const result = await this.client.translateText(text, source, target);
        return result.text;
    }
}
/**
 * Convenience factory for consumers who prefer functional style.
 */
export function createDeepLAdapter(apiKey) {
    return new DeepLAdapter(apiKey);
}
