import { applyTranslations, removeSystemFields } from '../utils/applyTranslations.js';
import { extractTranslatableFields } from '../utils/extractTranslatableFields.js';
export const translateHandler = async (req)=>{
    try {
        const { payload, user } = req;
        if (!user) {
            return Response.json({
                error: 'Unauthorized',
                success: false
            }, {
                status: 401
            });
        }
        const body = await req.json?.();
        if (!body) {
            return Response.json({
                error: 'Invalid request body',
                success: false
            }, {
                status: 400
            });
        }
        const { collection, documentId, sourceLocale, targetLocales } = body;
        if (!collection || !documentId || !sourceLocale || !targetLocales?.length) {
            return Response.json({
                error: 'Missing required fields',
                success: false
            }, {
                status: 400
            });
        }
        // Validate that no target locale equals the source locale
        const invalidLocales = targetLocales.filter((l)=>l === sourceLocale);
        if (invalidLocales.length > 0) {
            return Response.json({
                error: 'Source and target locale must differ',
                success: false
            }, {
                status: 400
            });
        }
        // Retrieve the adapter stored during plugin initialization
        const adapter = payload.config.custom?.translateAdapter;
        if (!adapter) {
            return Response.json({
                error: 'Translation adapter not configured',
                success: false
            }, {
                status: 500
            });
        }
        // Fetch source document
        const document = await payload.findByID({
            id: documentId,
            collection,
            depth: 0,
            locale: sourceLocale
        });
        if (!document) {
            return Response.json({
                error: 'Document not found',
                success: false
            }, {
                status: 404
            });
        }
        const collectionConfig = payload.collections[collection]?.config;
        if (!collectionConfig) {
            return Response.json({
                error: 'Collection not found',
                success: false
            }, {
                status: 404
            });
        }
        // Extract all translatable localized fields
        const translatableFields = extractTranslatableFields(document, collectionConfig.fields);
        if (translatableFields.length === 0) {
            return Response.json({
                message: 'No translatable fields found',
                success: true,
                translatedFields: 0,
                translatedLocales: 0
            });
        }
        let successfulLocales = 0;
        for (const targetLocale of targetLocales){
            try {
                // Translate each field individually (one API call per field)
                const translations = [];
                for (const field of translatableFields){
                    const translated = await adapter.translate(field.value, sourceLocale, targetLocale);
                    translations.push(translated);
                }
                const updatedData = applyTranslations(document, translatableFields, translations);
                const dataToUpdate = removeSystemFields(updatedData);
                await payload.update({
                    id: documentId,
                    collection,
                    data: dataToUpdate,
                    locale: targetLocale
                });
                successfulLocales++;
            } catch (localeError) {
                payload.logger.error(`Translation failed for locale ${targetLocale}: ${localeError instanceof Error ? localeError.message : String(localeError)}`);
            // Continue with remaining locales
            }
        }
        return Response.json({
            message: `Translated ${translatableFields.length} field(s) to ${successfulLocales} locale(s)`,
            success: true,
            translatedFields: translatableFields.length,
            translatedLocales: successfulLocales
        });
    } catch (error) {
        req.payload?.logger?.error(`Translation handler error: ${error instanceof Error ? error.message : String(error)}`);
        return Response.json({
            error: error instanceof Error ? error.message : 'Translation failed',
            success: false
        }, {
            status: 500
        });
    }
};

//# sourceMappingURL=translateHandler.js.map