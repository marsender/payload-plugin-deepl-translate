import type { TranslationAdapter } from './types.js';
/**
 * Built-in translation adapter using the DeepL API.
 * Translates one string per call using the official deepl-node SDK.
 * The SDK automatically routes to the Free or Pro endpoint based on the key suffix.
 */
export declare class DeepLAdapter implements TranslationAdapter {
    private client;
    constructor(apiKey: string);
    translate(text: string, sourceLang: string, targetLang: string): Promise<string>;
}
/**
 * Convenience factory for consumers who prefer functional style.
 */
export declare function createDeepLAdapter(apiKey: string): TranslationAdapter;
//# sourceMappingURL=deepl.d.ts.map