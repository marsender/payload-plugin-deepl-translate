import type { Config } from 'payload';
import type { PluginConfig } from './types.js';
export type { PluginConfig };
export { DeepLAdapter, createDeepLAdapter } from './adapters/deepl.js';
export type { TranslationAdapter } from './adapters/types.js';
export type { TranslatableField, TranslationRequest, TranslationResponse } from './types.js';
/**
 * Payload CMS plugin that adds content translation via the DeepL API
 * (or a custom translation adapter) to configured collections.
 *
 * @example
 * ```ts
 * // payload.config.ts
 * import { deeplTranslatePlugin } from '@marsender/payload-plugin-deepl-translate'
 *
 * export default buildConfig({
 *   plugins: [
 *     deeplTranslatePlugin({
 *       collections: ['pages', 'posts'],
 *       deeplApiKey: process.env.DEEPL_API_KEY,
 *     }),
 *   ],
 * })
 * ```
 */
export declare const deeplTranslatePlugin: (pluginConfig: PluginConfig) => (config: Config) => Config;
//# sourceMappingURL=index.d.ts.map