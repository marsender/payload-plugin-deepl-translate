import type { CollectionSlug, Payload, PayloadRequest } from 'payload'

import type { TranslationAdapter } from './adapters/types.js'

/**
 * Plugin configuration — provide either a DeepL API key (uses built-in adapter)
 * or a custom TranslationAdapter object.
 */
export type PluginConfig = {
  /** Collection slugs that will display the Translate button in the admin panel. */
  collections: CollectionSlug[]
  /** When true, the plugin is a no-op and returns the Payload config unchanged. */
  disabled?: boolean
  /**
   * Optional field path in the document that holds the tenant relationship.
   * Defaults to `'tenant'`. Used together with `tenantFilter`.
   */
  tenantField?: string
  /**
   * Optional function called server-side to decide whether the Translate button
   * should be available for the current document's tenant.
   * Receives the tenant ID (string) or `null` when the field is absent.
   * Return `true` to enable, `false` to hide the button.
   * When omitted, the button is available for all tenants.
   *
   * `req` is the request the translation is running under, and is passed so the callback's
   * Payload calls can join its DB transaction. It is `undefined` when the filter is evaluated
   * while rendering the admin UI (a React Server Component, which Payload gives no request) —
   * forward it as-is either way.
   *
   * @example
   * ```ts
   * tenantFilter: (tenantId) => premiumTenantIds.includes(tenantId ?? '')
   * // async variant also supported
   * tenantFilter: async (tenantId, payload, req) => {
   *   const tenant = await payload.findByID({ collection: 'tenants', id: tenantId ?? '', req })
   *   return tenant?.translationEnabled === true
   * }
   * ```
   */
  tenantFilter?: (
    tenantId: string | null,
    payload: Payload,
    req?: PayloadRequest,
  ) => boolean | Promise<boolean>
  /**
   * Optional callback invoked after a successful translation request.
   * Use this to update usage counters or trigger side effects.
   * Receives the tenant ID, the Payload instance, and the total number of characters translated.
   *
   * `req` is the request the translation ran under. Pass it to every Payload call made here:
   * this callback writes (usage counters) inside the translation request, and a write that
   * omits `req` runs on a separate pooled connection in its own transaction — it commits even
   * when the request rolls back, and can deadlock against rows the request already locked.
   */
  onAfterTranslate?: (options: {
    payload: Payload
    req?: PayloadRequest
    tenantId: string | null
    translatedCharacters: number
  }) => Promise<void>
  /**
   * Optional function called server-side to report the tenant's month-to-date translation usage,
   * so the Translate modal can show a progress bar before a translation is requested. Receives the
   * tenant ID (string) or `null` when the field is absent. Return `null` to omit the bar (e.g. no
   * billing cap for this tenant).
   *
   * `req` is the request the check runs under (present for the `/translate-check` endpoint call,
   * `undefined` when evaluated while rendering the admin UI) — forward it as-is so any Payload
   * reads join the request transaction when there is one.
   *
   * @example
   * ```ts
   * usageProvider: async (tenantId, payload, req) => {
   *   const { docs } = await payload.find({
   *     collection: 'tenant-settings',
   *     where: { tenant: { equals: tenantId } },
   *     limit: 1,
   *     req,
   *   })
   *   const s = docs[0]?.tools?.translation
   *   return s ? { used: s.nbCharacters ?? 0, max: s.maxCharacters } : null
   * }
   * ```
   */
  usageProvider?: (
    tenantId: string | null,
    payload: Payload,
    req?: PayloadRequest,
  ) => Promise<TranslationUsage | null> | TranslationUsage | null
  /**
   * Optional mapping of Payload locale codes to adapter-specific language codes.
   * Use this when your adapter requires a more specific code than what Payload uses.
   * @example { en: 'en-US', 'pt': 'pt-BR' }
   */
  localeMapping?: Record<string, string>
} & (
  | {
      /** DeepL API key. Mutually exclusive with `adapter`. */
      deeplApiKey: string | undefined
      adapter?: never
    }
  | {
      /** Custom translation adapter. Mutually exclusive with `deeplApiKey`. */
      adapter: TranslationAdapter
      deeplApiKey?: never
    }
)

/**
 * Month-to-date translation usage for the current document's tenant, used to render the
 * progress bar in the Translate modal. `max` of 0 (or less) means "no cap" — the bar is hidden.
 */
export type TranslationUsage = {
  /** Characters translated so far this billing period. */
  used: number
  /** Monthly character allowance. */
  max: number
}

/**
 * A single localized field extracted from a Payload document, ready for translation.
 */
export type TranslatableField = {
  /**
   * For richText fields: dot-notation path to the specific Lexical text node
   * within the editor state (e.g. "root.children.0.children.1").
   */
  lexicalPath?: string
  /** Dot-notation path to the field in the document (e.g. "title", "sections.0.body"). */
  path: string
  /** Field type — determines how the value is extracted and re-applied. */
  type: 'richText' | 'text' | 'textarea'
  /** The extracted string content to be translated. */
  value: string
}

/**
 * Body of the POST /api/translate request sent from the admin UI.
 */
export type TranslationRequest = {
  /** Slug of the Payload collection containing the document. */
  collection: string
  /** ID of the document to translate. */
  documentId: number | string
  /** Locale code of the source content (e.g. "en"). */
  sourceLocale: string
  /** One or more target locale codes to translate into (e.g. ["fr", "de"]). */
  targetLocales: string[]
}

/**
 * Response returned by the POST /api/translate endpoint.
 */
export type TranslationResponse = {
  /** Human-readable error description (present on failure). */
  error?: string
  /** Per-locale error details when some locales failed. */
  errors?: Record<string, string>
  /** Human-readable success summary (present on success). */
  message?: string
  /** Overall outcome of the translation request. */
  success: boolean
  /** Number of fields translated per locale (present on success). */
  translatedFields?: number
  /** Number of locales successfully updated (present on success). */
  translatedLocales?: number
  /** Total characters sent to the translation API across all locales (present on success). */
  translatedCharacters?: number
}
