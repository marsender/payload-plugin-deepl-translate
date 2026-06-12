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
  translate(text: string, sourceLang: string, targetLang: string): Promise<string>

  /**
   * Optional: translate many strings in as few API calls as possible.
   *
   * When implemented, the endpoint sends the whole document in batched
   * requests instead of one call per segment, avoiding gateway timeouts on
   * large documents. The returned array MUST be the same length as `texts`
   * and preserve order (result[i] is the translation of texts[i]).
   *
   * If omitted, the endpoint falls back to calling {@link translate} once
   * per segment sequentially.
   *
   * @param texts - The strings to translate, in order
   * @param sourceLang - Source language code (e.g. "EN", "FR")
   * @param targetLang - Target language code (e.g. "DE", "ES")
   * @returns Promise resolving to the translated strings, same length and order as `texts`
   */
  translateBatch?(texts: string[], sourceLang: string, targetLang: string): Promise<string[]>
}
