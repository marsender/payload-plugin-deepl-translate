import type { Config } from 'payload'

import type { PluginConfig } from './types.js'

import { DeepLAdapter } from './adapters/deepl.js'
import { translateCheckHandler } from './endpoints/translateCheckHandler.js'
import { translateHandler } from './endpoints/translateHandler.js'
import { translations } from './translations/index.js'
import type { PluginDefaultTranslationsObject } from './translations/types.js'

export type { PluginConfig }
export { DeepLAdapter, createDeepLAdapter } from './adapters/deepl.js'
export type { TranslationAdapter } from './adapters/types.js'
export type { TranslatableField, TranslationRequest, TranslationResponse } from './types.js'

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
export const deeplTranslatePlugin =
  (pluginConfig: PluginConfig) =>
  (config: Config): Config => {
    if (pluginConfig.disabled) {
      return config
    }

    // Resolve the effective adapter
    let adapter
    if (pluginConfig.deeplApiKey) {
      adapter = new DeepLAdapter(pluginConfig.deeplApiKey)
    } else if (pluginConfig.adapter) {
      adapter = pluginConfig.adapter
    } else {
      // console.error(
      //   '[payload-plugin-deepl-translate] No translation adapter configured. ' +
      //     'Provide either `deeplApiKey` or a custom `adapter` in the plugin config. ' +
      //     'Plugin will be disabled.',
      // )
      return config
    }

    // Store adapter and locale mapping for use in the endpoint handler
    if (!config.custom) {
      config.custom = {}
    }
    ;(config.custom as Record<string, unknown>).translateAdapter = adapter
    ;(config.custom as Record<string, unknown>).translateLocaleMapping = pluginConfig.localeMapping ?? {}
    // tenantFilter and onAfterTranslate are functions — stored server-side only (not serialized to the client)
    ;(config.custom as Record<string, unknown>).translateTenantsFilter = pluginConfig.tenantFilter ?? null
    ;(config.custom as Record<string, unknown>).translateOnAfterTranslate = pluginConfig.onAfterTranslate ?? null
    // Boolean flag and field name ARE serializable and available to the client component
    ;(config.custom as Record<string, unknown>).translateTenantsEnabled = !!pluginConfig.tenantFilter
    ;(config.custom as Record<string, unknown>).translateTenantField = pluginConfig.tenantField ?? 'tenant'

    // Inject TranslateButton into each configured collection
    if (!config.collections) {
      config.collections = []
    }

    for (const slug of pluginConfig.collections) {
      const collection = config.collections.find((c) => c.slug === slug)
      if (collection) {
        if (!collection.admin) {
          collection.admin = {}
        }
        if (!collection.admin.components) {
          collection.admin.components = {}
        }
        if (!collection.admin.components.edit) {
          collection.admin.components.edit = {}
        }
        if (!collection.admin.components.edit.beforeDocumentControls) {
          collection.admin.components.edit.beforeDocumentControls = []
        }
        collection.admin.components.edit.beforeDocumentControls.push('@marsender/payload-plugin-deepl-translate/client#TranslateButton')
      }
    }

    // Register translation endpoints
    if (!config.endpoints) {
      config.endpoints = []
    }
    config.endpoints.push({
      handler: translateCheckHandler,
      method: 'get',
      path: '/translate-check',
    })
    config.endpoints.push({
      handler: translateHandler,
      method: 'post',
      path: '/translate',
    })

    // Merge plugin i18n translations into config
    if (!config.i18n) {
      config.i18n = {}
    }
    if (!config.i18n.translations) {
      config.i18n.translations = {}
    }

    const i18nTranslations = config.i18n.translations as Record<string, Record<string, unknown>>
    for (const [locale, langObj] of Object.entries(translations)) {
      const existing = (i18nTranslations[locale] ?? {}) as PluginDefaultTranslationsObject
      i18nTranslations[locale] = {
        ...existing,
        'plugin-deepl-translate': langObj.translations['plugin-deepl-translate'],
      }
    }

    return config
  }
