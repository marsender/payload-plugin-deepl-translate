import type { PayloadHandler } from 'payload'

import type { TranslationAdapter } from '../adapters/types.js'
import type { TranslationRequest, TranslationResponse } from '../types.js'

import { applyTranslations, removeSystemFields } from '../utils/applyTranslations.js'
import { extractTranslatableFields } from '../utils/extractTranslatableFields.js'

export const translateHandler: PayloadHandler = async (req) => {
  try {
    const { payload, user } = req

    if (!user) {
      return Response.json({ error: 'Unauthorized', success: false } as TranslationResponse, {
        status: 401,
      })
    }

    const body = (await req.json?.()) as TranslationRequest | undefined
    if (!body) {
      return Response.json(
        { error: 'Invalid request body', success: false } as TranslationResponse,
        { status: 400 },
      )
    }

    const { collection, documentId, sourceLocale, targetLocales } = body

    if (!collection || !documentId || !sourceLocale || !targetLocales?.length) {
      return Response.json(
        { error: 'Missing required fields', success: false } as TranslationResponse,
        { status: 400 },
      )
    }

    // Validate that no target locale equals the source locale
    const invalidLocales = targetLocales.filter((l) => l === sourceLocale)
    if (invalidLocales.length > 0) {
      return Response.json(
        {
          error: 'Source and target locale must differ',
          success: false,
        } as TranslationResponse,
        { status: 400 },
      )
    }

    // Retrieve the adapter and locale mapping stored during plugin initialization
    const custom = payload.config.custom as Record<string, unknown> | undefined
    const adapter = custom?.translateAdapter as TranslationAdapter | undefined
    const localeMapping = (custom?.translateLocaleMapping ?? {}) as Record<string, string>

    if (!adapter) {
      return Response.json(
        { error: 'Translation adapter not configured', success: false } as TranslationResponse,
        { status: 500 },
      )
    }

    payload.logger.info(
      `[translate] Starting: collection=${collection} id=${documentId} source=${sourceLocale} targets=${targetLocales.join(',')}`,
    )

    // Fetch source document
    const document = await payload.findByID({
      id: documentId,
      collection,
      depth: 0,
      locale: sourceLocale as never,
    })

    if (!document) {
      return Response.json(
        { error: 'Document not found', success: false } as TranslationResponse,
        { status: 404 },
      )
    }

    const collectionConfig = payload.collections[collection]?.config
    if (!collectionConfig) {
      return Response.json(
        { error: 'Collection not found', success: false } as TranslationResponse,
        { status: 404 },
      )
    }

    // Extract all translatable localized fields
    const translatableFields = extractTranslatableFields(
      document as Record<string, unknown>,
      collectionConfig.fields,
    )

    payload.logger.info(
      `[translate] Extracted ${translatableFields.length} translatable text segment(s) from document ${documentId}`,
    )

    if (translatableFields.length === 0) {
      return Response.json({
        message: 'No translatable fields found',
        success: true,
        translatedFields: 0,
        translatedLocales: 0,
      } as TranslationResponse)
    }

    let successfulLocales = 0
    const localeErrors: Record<string, string> = {}

    for (const targetLocale of targetLocales) {
      try {
        // Apply optional locale mapping (e.g. 'en' → 'en-US' for DeepL)
        const mappedSource = localeMapping[sourceLocale] ?? sourceLocale
        const mappedTarget = localeMapping[targetLocale] ?? targetLocale

        payload.logger.info(
          `[translate] Translating ${translatableFields.length} segment(s) from ${mappedSource} to ${mappedTarget} (locale: ${targetLocale})`,
        )

        // Translate each field individually (one API call per field)
        const translations: string[] = []
        for (let i = 0; i < translatableFields.length; i++) {
          const field = translatableFields[i]
          const translated = await adapter.translate(field.value, mappedSource, mappedTarget)
          payload.logger.info(
            `[translate]   [${i + 1}/${translatableFields.length}] path=${field.path}${field.lexicalPath ? ' lexical=' + field.lexicalPath : ''} | "${field.value.slice(0, 50)}" → "${translated.slice(0, 50)}"`,
          )
          translations.push(translated)
        }

        payload.logger.info(`[translate] Applying translations to document data`)
        const updatedData = applyTranslations(
          document as Record<string, unknown>,
          translatableFields,
          translations,
        )

        const dataToUpdate = removeSystemFields(updatedData)

        payload.logger.info(
          `[translate] Saving to locale=${targetLocale} collection=${collection} id=${documentId}`,
        )
        await payload.update({
          id: documentId,
          collection,
          data: dataToUpdate as never,
          locale: targetLocale as never,
          overrideAccess: true,
          req,
        })

        payload.logger.info(`[translate] Successfully saved locale=${targetLocale}`)
        successfulLocales++
      } catch (localeError) {
        const errMsg = localeError instanceof Error ? localeError.message : String(localeError)
        const errStack = localeError instanceof Error ? (localeError.stack ?? '') : ''
        payload.logger.error(
          `[translate] Failed for locale=${targetLocale}: ${errMsg}\n${errStack}`,
        )
        localeErrors[targetLocale] = errMsg
      }
    }

    const hasErrors = Object.keys(localeErrors).length > 0
    const allFailed = successfulLocales === 0 && targetLocales.length > 0

    return Response.json({
      errors: hasErrors ? localeErrors : undefined,
      message: allFailed
        ? `Translation failed: ${translatableFields.length} segment(s) extracted but 0/${targetLocales.length} locale(s) saved — check server logs`
        : `Translated ${translatableFields.length} segment(s) to ${successfulLocales}/${targetLocales.length} locale(s)${hasErrors ? ' (partial — see errors)' : ''}`,
      success: !allFailed,
      translatedFields: translatableFields.length,
      translatedLocales: successfulLocales,
    } as TranslationResponse)
  } catch (error) {
    req.payload?.logger?.error(`[translate] Handler error: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`)
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Translation failed',
        success: false,
      } as TranslationResponse,
      { status: 500 },
    )
  }
}
