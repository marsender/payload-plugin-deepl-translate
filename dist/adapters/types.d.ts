/**
 * Interface for translation adapters.
 * Implement this interface to use a custom translation provider
 * instead of the built-in DeepL adapter.
 *
 * @example Google Translate adapter
 * ```ts
 * const googleAdapter: TranslationAdapter = {
 *   async translate(text, sourceLang, targetLang) {
 *     const response = await googleTranslate(text, { from: sourceLang, to: targetLang })
 *     return response.text
 *   }
 * }
 * ```
 */
export interface TranslationAdapter {
    /**
     * Translate a single string from source language to target language.
     * @param text - The string to translate
     * @param sourceLang - Source language code (e.g. "EN", "FR")
     * @param targetLang - Target language code (e.g. "DE", "ES")
     * @returns Promise resolving to the translated string
     */
    translate(text: string, sourceLang: string, targetLang: string): Promise<string>;
}
//# sourceMappingURL=types.d.ts.map