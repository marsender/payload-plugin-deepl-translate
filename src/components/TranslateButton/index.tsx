'use client'

import type { Locale } from 'payload'

import {
  Button,
  Modal,
  ReactSelect,
  type ReactSelectOption,
  useConfig,
  useDocumentInfo,
  useLocale,
  useModal,
  useTranslation,
} from '@payloadcms/ui'
import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'

import './index.scss'

const MODAL_SLUG = 'translate-document-modal'

export const TranslateButton: React.FC = () => {
  const { config } = useConfig()
  const { id, collectionSlug } = useDocumentInfo()
  const locale = useLocale()
  const { closeModal, openModal } = useModal()
  const { t: tRaw } = useTranslation()
  // plugin-deepl-translate keys are not in Payload's strict union — cast to allow any key
  const t = tRaw as (key: string, options?: Record<string, unknown>) => string

  // Compute available target locales (all locales except the current one)
  const localization = config.localization
  const allLocales = localization ? localization.locales : []
  const availableTargetLocales = allLocales.filter((l: Locale | string) => {
    const code = typeof l === 'string' ? l : l.code
    return code !== locale?.code
  })

  // Build react-select options
  const localeOptions: ReactSelectOption[] = availableTargetLocales.map((l: Locale | string) => {
    if (typeof l === 'string') {
      return { label: l.toUpperCase(), value: l }
    }
    return {
      label: typeof l.label === 'string' ? l.label : l.code.toUpperCase(),
      value: l.code,
    }
  })

  // Pre-select ALL available target locales on mount (FR-013)
  const [isTranslating, setIsTranslating] = useState(false)
  const [selectedLocales, setSelectedLocales] = useState<ReactSelectOption[]>(localeOptions)

  const handleOpen = useCallback(() => {
    // Reset selection to all locales each time the modal opens
    setSelectedLocales(localeOptions)
    openModal(MODAL_SLUG)
  }, [localeOptions, openModal])

  const handleCancel = useCallback(() => {
    closeModal(MODAL_SLUG)
  }, [closeModal])

  const handleTranslate = useCallback(async () => {
    if (!collectionSlug || !id || !locale?.code || selectedLocales.length === 0) {
      return
    }

    setIsTranslating(true)
    closeModal(MODAL_SLUG)

    const targetLocales = selectedLocales.map((o) => o.value)

    try {
      const response = await fetch(`${config.serverURL}${config.routes.api}/translate`, {
        body: JSON.stringify({
          collection: collectionSlug,
          documentId: id,
          sourceLocale: locale.code,
          targetLocales,
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })

      const result = (await response.json()) as {
        success: boolean
        message?: string
        error?: string
        translatedFields?: number
        translatedLocales?: number
      }

      if (result.success) {
        const msg =
          result.translatedFields !== undefined && result.translatedLocales !== undefined
            ? (t('plugin-deepl-translate:successMessage') as string)
                .replace('{{fields}}', String(result.translatedFields))
                .replace('{{locales}}', String(result.translatedLocales))
            : (result.message ?? 'Translation complete')
        toast.success(msg)
      } else {
        toast.error(result.error ?? 'Translation failed')
      }
    } catch (_error) {
      toast.error('Translation request failed')
    } finally {
      setIsTranslating(false)
    }
  }, [closeModal, collectionSlug, config, id, locale, selectedLocales, t])

  // Hide button when: no localization, no other locales available, or doc not saved yet
  if (!config.localization || availableTargetLocales.length === 0 || !id) {
    return null
  }

  const translateLabel = (t('plugin-deepl-translate:translateButton') as string) || 'Translate'
  const translatingLabel = (t('plugin-deepl-translate:translating') as string) || 'Translating...'
  const modalTitle = (t('plugin-deepl-translate:translateModalTitle') as string) || 'Translate Document'
  const modalDescription =
    ((t('plugin-deepl-translate:translateModalDescription') as string) || 'Translate content from {{sourceLocale}} to:').replace(
      '{{sourceLocale}}',
      locale?.code?.toUpperCase() ?? '',
    )
  const cancelLabel = (t('plugin-deepl-translate:cancelButton') as string) || 'Cancel'
  const placeholder = (t('plugin-deepl-translate:selectLocalesPlaceholder') as string) || 'Select target locales...'

  return (
    <>
      <Button
        buttonStyle="secondary"
        disabled={isTranslating}
        onClick={handleOpen}
      >
        {isTranslating ? translatingLabel : translateLabel}
      </Button>

      <Modal className="translate-modal" slug={MODAL_SLUG}>
        <div className="translate-modal__wrapper">
          <div className="translate-modal__content">
            <h3>{modalTitle}</h3>
            <p dangerouslySetInnerHTML={{ __html: modalDescription }} />
            <div className="translate-modal__select">
              <ReactSelect
                isMulti
                onChange={(options) =>
                  setSelectedLocales((options as ReactSelectOption[]) ?? [])
                }
                options={localeOptions}
                placeholder={placeholder}
                value={selectedLocales}
              />
            </div>
          </div>
          <div className="translate-modal__controls">
            <Button buttonStyle="secondary" onClick={handleCancel} size="medium">
              {cancelLabel}
            </Button>
            <Button
              disabled={selectedLocales.length === 0}
              onClick={handleTranslate}
              size="medium"
            >
              {translateLabel}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
