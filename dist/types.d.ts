import type { CollectionSlug } from 'payload';
import type { TranslationAdapter } from './adapters/types.js';
/**
 * Plugin configuration — provide either a DeepL API key (uses built-in adapter)
 * or a custom TranslationAdapter object.
 */
export type PluginConfig = {
    /** Collection slugs that will display the Translate button in the admin panel. */
    collections: CollectionSlug[];
    /** When true, the plugin is a no-op and returns the Payload config unchanged. */
    disabled?: boolean;
} & ({
    /** DeepL API key. Mutually exclusive with `adapter`. */
    deeplApiKey: string | undefined;
    adapter?: never;
} | {
    /** Custom translation adapter. Mutually exclusive with `deeplApiKey`. */
    adapter: TranslationAdapter;
    deeplApiKey?: never;
});
/**
 * A single localized field extracted from a Payload document, ready for translation.
 */
export type TranslatableField = {
    /**
     * For richText fields: dot-notation path to the specific Lexical text node
     * within the editor state (e.g. "root.children.0.children.1").
     */
    lexicalPath?: string;
    /** Dot-notation path to the field in the document (e.g. "title", "sections.0.body"). */
    path: string;
    /** Field type — determines how the value is extracted and re-applied. */
    type: 'richText' | 'text' | 'textarea';
    /** The extracted string content to be translated. */
    value: string;
};
/**
 * Body of the POST /api/translate request sent from the admin UI.
 */
export type TranslationRequest = {
    /** Slug of the Payload collection containing the document. */
    collection: string;
    /** ID of the document to translate. */
    documentId: number | string;
    /** Locale code of the source content (e.g. "en"). */
    sourceLocale: string;
    /** One or more target locale codes to translate into (e.g. ["fr", "de"]). */
    targetLocales: string[];
};
/**
 * Response returned by the POST /api/translate endpoint.
 */
export type TranslationResponse = {
    /** Human-readable error description (present on failure). */
    error?: string;
    /** Human-readable success summary (present on success). */
    message?: string;
    /** Overall outcome of the translation request. */
    success: boolean;
    /** Number of fields translated per locale (present on success). */
    translatedFields?: number;
    /** Number of locales successfully updated (present on success). */
    translatedLocales?: number;
};
//# sourceMappingURL=types.d.ts.map