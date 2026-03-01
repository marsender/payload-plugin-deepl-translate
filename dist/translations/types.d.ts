import type { Language } from '@payloadcms/translations';
export type PluginTranslationKeys = {
    'plugin-deepl-translate': {
        cancelButton: string;
        errorDocumentNotFound: string;
        errorNoAdapter: string;
        errorSameLocale: string;
        noFieldsFound: string;
        selectLocalesPlaceholder: string;
        successMessage: string;
        translateButton: string;
        translateModalDescription: string;
        translateModalTitle: string;
        translating: string;
    };
};
export type PluginLanguage = Language<PluginTranslationKeys>;
export type PluginDefaultTranslationsObject = PluginTranslationKeys;
//# sourceMappingURL=types.d.ts.map