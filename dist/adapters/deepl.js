import * as deepl from 'deepl-node';
/**
 * Built-in translation adapter using the DeepL API.
 * Translates one string per call using the official deepl-node SDK.
 * The SDK automatically routes to the Free or Pro endpoint based on the key suffix.
 */ export class DeepLAdapter {
    client;
    constructor(apiKey){
        this.client = new deepl.DeepLClient(apiKey);
    }
    async translate(text, sourceLang, targetLang) {
        // DeepL expects uppercase language codes; Payload uses lowercase.
        // NOTE: 'EN' and 'PT' are not valid DeepL target language codes.
        // Use the plugin's `localeMapping` option to map them to regional variants:
        //   localeMapping: { en: 'en-US', pt: 'pt-BR' }
        const source = sourceLang.toUpperCase();
        const target = targetLang.toUpperCase();
        const result = await this.client.translateText(text, source, target);
        return result.text;
    }
}
/**
 * Convenience factory for consumers who prefer functional style.
 */ export function createDeepLAdapter(apiKey) {
    return new DeepLAdapter(apiKey);
}

//# sourceMappingURL=deepl.js.map