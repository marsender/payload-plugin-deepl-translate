import * as deepl from 'deepl-node';
async function withRetry(fn, maxRetries = 3) {
    let lastError;
    for(let attempt = 0; attempt <= maxRetries; attempt++){
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            if (attempt < maxRetries) {
                const delay = 500 * 2 ** attempt // 500ms, 1000ms, 2000ms
                ;
                console.warn(`[DeepLAdapter] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, err instanceof Error ? err.message : String(err));
                await new Promise((r)=>setTimeout(r, delay));
            }
        }
    }
    throw lastError;
}
/**
 * Built-in translation adapter using the DeepL API.
 * Translates one string per call using the official deepl-node SDK.
 * The SDK automatically routes to the Free or Pro endpoint based on the key suffix.
 */ export class DeepLAdapter {
    // DeepL accepts up to 50 text items per request.
    static MAX_BATCH = 50;
    client;
    constructor(apiKey){
        this.client = new deepl.DeepLClient(apiKey);
    }
    // DeepL source languages never accept regional variants (e.g. 'EN-US' is invalid as source).
    // Strip the subtag so 'en-US' → 'EN', 'fr-FR' → 'FR', etc.
    // Target languages may have regional variants: 'EN-US', 'PT-BR', 'ZH-HANS' are all valid.
    // Use the plugin's `localeMapping` to map targets that need regional variants:
    //   localeMapping: { en: 'en-US', pt: 'pt-BR' }
    mapLangs(sourceLang, targetLang) {
        const [baseLang] = sourceLang.toUpperCase().split('-');
        return {
            source: baseLang,
            target: targetLang.toUpperCase()
        };
    }
    async translate(text, sourceLang, targetLang) {
        const { source, target } = this.mapLangs(sourceLang, targetLang);
        const result = await withRetry(()=>this.client.translateText(text, source, target));
        return result.text;
    }
    /**
   * Translate many strings in chunks of up to {@link DeepLAdapter.MAX_BATCH}
   * per request. DeepL preserves the order of the input array, so the result
   * maps 1:1 by index to `texts`.
   */ async translateBatch(texts, sourceLang, targetLang) {
        if (texts.length === 0) {
            return [];
        }
        const { source, target } = this.mapLangs(sourceLang, targetLang);
        const results = [];
        for(let i = 0; i < texts.length; i += DeepLAdapter.MAX_BATCH){
            const chunk = texts.slice(i, i + DeepLAdapter.MAX_BATCH);
            const res = await withRetry(()=>this.client.translateText(chunk, source, target));
            results.push(...res.map((r)=>r.text));
        }
        return results;
    }
}
/**
 * Convenience factory for consumers who prefer functional style.
 */ export function createDeepLAdapter(apiKey) {
    return new DeepLAdapter(apiKey);
}

//# sourceMappingURL=deepl.js.map