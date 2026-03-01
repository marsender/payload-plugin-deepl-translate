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
 */ export { };

//# sourceMappingURL=types.js.map