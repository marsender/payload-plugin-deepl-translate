import { DeepLAdapter } from './adapters/deepl.js';
import { translateCheckHandler } from './endpoints/translateCheckHandler.js';
import { translateHandler } from './endpoints/translateHandler.js';
import { translations } from './translations/index.js';
export { DeepLAdapter, createDeepLAdapter } from './adapters/deepl.js';
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
 */ export const deeplTranslatePlugin = (pluginConfig)=>(config)=>{
        if (pluginConfig.disabled) {
            return config;
        }
        // Resolve the effective adapter
        let adapter;
        if (pluginConfig.deeplApiKey) {
            adapter = new DeepLAdapter(pluginConfig.deeplApiKey);
        } else if (pluginConfig.adapter) {
            adapter = pluginConfig.adapter;
        } else {
            // console.error(
            //   '[payload-plugin-deepl-translate] No translation adapter configured. ' +
            //     'Provide either `deeplApiKey` or a custom `adapter` in the plugin config. ' +
            //     'Plugin will be disabled.',
            // )
            return config;
        }
        // Store runtime values in config.custom for use by server-side handlers and components.
        //
        // IMPORTANT — Payload serializes config.custom to the client (via useConfig()) using
        // JSON serialization, which silently drops functions and class instances. Only plain
        // serializable values (strings, booleans, numbers, plain objects) survive.
        //
        // Therefore:
        //   - translateAdapter       → class instance, server-side only (used by translateHandler)
        //   - translateTenantsFilter → function,      server-side only (used by TranslateButtonWrapper)
        //   - translateOnAfterTranslate → function,   server-side only (used by translateHandler)
        //   - translateLocaleMapping → plain object,  serializable (but not needed client-side here)
        //   - translateTenantField   → string,        serializable and used server-side
        if (!config.custom) {
            config.custom = {};
        }
        ;
        config.custom.translateAdapter = adapter;
        config.custom.translateLocaleMapping = pluginConfig.localeMapping ?? {};
        config.custom.translateTenantsFilter = pluginConfig.tenantFilter ?? null;
        config.custom.translateOnAfterTranslate = pluginConfig.onAfterTranslate ?? null;
        config.custom.translateTenantField = pluginConfig.tenantField ?? 'tenant';
        // Register TranslateButtonWrapper (async RSC) in each configured collection's admin UI.
        //
        // Payload component registration mechanism used here:
        //   Instead of a plain path string, we pass a RawPayloadComponent object:
        //     { path, serverProps }
        //
        //   `serverProps` on the component object are merged into the RSC's props at render
        //   time, on top of Payload's standard serverProps (id, payload, i18n, locale, …).
        //   This lets us bake per-collection data (collectionSlug) into the registration at
        //   config time, without creating a separate component per collection.
        //
        //   See: RawPayloadComponent in payload/dist/config/types.d.ts
        //        RenderServerComponent in @payloadcms/ui/elements/RenderServerComponent
        //
        // Why a server component wrapper instead of a client component with a fetch:
        //   The tenantFilter function lives in config.custom and is NOT serialized to the
        //   client. A client component cannot run the filter directly; it would need an API
        //   call per document load. The RSC wrapper runs the filter server-side during page
        //   rendering and conditionally renders TranslateButton, eliminating the round-trip.
        if (!config.collections) {
            config.collections = [];
        }
        for (const slug of pluginConfig.collections){
            const collection = config.collections.find((c)=>c.slug === slug);
            if (collection) {
                if (!collection.admin) {
                    collection.admin = {};
                }
                if (!collection.admin.components) {
                    collection.admin.components = {};
                }
                if (!collection.admin.components.edit) {
                    collection.admin.components.edit = {};
                }
                if (!collection.admin.components.edit.beforeDocumentControls) {
                    collection.admin.components.edit.beforeDocumentControls = [];
                }
                collection.admin.components.edit.beforeDocumentControls.push({
                    // RawPayloadComponent: `path` is the import path, `serverProps` are merged
                    // into the RSC props at render time alongside Payload's standard serverProps.
                    path: '@marsender/payload-plugin-deepl-translate/client#TranslateButtonWrapper',
                    serverProps: {
                        collectionSlug: slug
                    }
                });
            }
        }
        // Register translation endpoints
        if (!config.endpoints) {
            config.endpoints = [];
        }
        config.endpoints.push({
            handler: translateCheckHandler,
            method: 'get',
            path: '/translate-check'
        });
        config.endpoints.push({
            handler: translateHandler,
            method: 'post',
            path: '/translate'
        });
        // Merge plugin i18n translations into config
        if (!config.i18n) {
            config.i18n = {};
        }
        if (!config.i18n.translations) {
            config.i18n.translations = {};
        }
        const i18nTranslations = config.i18n.translations;
        for (const [locale, langObj] of Object.entries(translations)){
            const existing = i18nTranslations[locale] ?? {};
            i18nTranslations[locale] = {
                ...existing,
                'plugin-deepl-translate': langObj.translations['plugin-deepl-translate']
            };
        }
        return config;
    };

//# sourceMappingURL=index.js.map