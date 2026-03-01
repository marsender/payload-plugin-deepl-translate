'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Button, Modal, ReactSelect, useConfig, useDocumentInfo, useLocale, useModal, useTranslation, toast } from '@payloadcms/ui';
import React, { useCallback, useState } from 'react';
import './index.scss';
const MODAL_SLUG = 'translate-document-modal';
export const TranslateButton = ()=>{
    const { config } = useConfig();
    const { id, collectionSlug } = useDocumentInfo();
    const locale = useLocale();
    const { closeModal, openModal } = useModal();
    const { t: tRaw } = useTranslation();
    // plugin-deepl-translate keys are not in Payload's strict union — cast to allow any key
    const t = tRaw;
    // Compute available target locales (all locales except the current one)
    const localization = config.localization;
    const allLocales = localization ? localization.locales : [];
    const availableTargetLocales = allLocales.filter((l)=>{
        const code = typeof l === 'string' ? l : l.code;
        return code !== locale?.code;
    });
    // Build react-select options
    const localeOptions = availableTargetLocales.map((l)=>{
        if (typeof l === 'string') {
            return {
                label: l.toUpperCase(),
                value: l
            };
        }
        return {
            label: typeof l.label === 'string' ? l.label : l.code.toUpperCase(),
            value: l.code
        };
    });
    // Pre-select ALL available target locales on mount (FR-013)
    const [isTranslating, setIsTranslating] = useState(false);
    const [selectedLocales, setSelectedLocales] = useState(localeOptions);
    const handleOpen = useCallback(()=>{
        // Reset selection to all locales each time the modal opens
        setSelectedLocales(localeOptions);
        openModal(MODAL_SLUG);
    }, [
        localeOptions,
        openModal
    ]);
    const handleCancel = useCallback(()=>{
        closeModal(MODAL_SLUG);
    }, [
        closeModal
    ]);
    const handleTranslate = useCallback(async ()=>{
        if (!collectionSlug || !id || !locale?.code || selectedLocales.length === 0) {
            return;
        }
        setIsTranslating(true);
        closeModal(MODAL_SLUG);
        const targetLocales = selectedLocales.map((o)=>o.value);
        try {
            const response = await fetch(`${config.serverURL}${config.routes.api}/translate`, {
                body: JSON.stringify({
                    collection: collectionSlug,
                    documentId: id,
                    sourceLocale: locale.code,
                    targetLocales
                }),
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST'
            });
            const result = await response.json();
            if (result.success) {
                const msg = result.translatedFields !== undefined && result.translatedLocales !== undefined ? t('plugin-deepl-translate:successMessage').replace('{{fields}}', String(result.translatedFields)).replace('{{locales}}', String(result.translatedLocales)) : result.message ?? 'Translation complete';
                toast.success(msg);
            } else {
                toast.error(result.error ?? 'Translation failed');
            }
        } catch (_error) {
            toast.error('Translation request failed');
        } finally{
            setIsTranslating(false);
        }
    }, [
        closeModal,
        collectionSlug,
        config,
        id,
        locale,
        selectedLocales,
        t
    ]);
    // Hide button when: no localization, no other locales available, or doc not saved yet
    if (!config.localization || availableTargetLocales.length === 0 || !id) {
        return null;
    }
    const translateLabel = t('plugin-deepl-translate:translateButton') || 'Translate';
    const translatingLabel = t('plugin-deepl-translate:translating') || 'Translating...';
    const modalTitle = t('plugin-deepl-translate:translateModalTitle') || 'Translate Document';
    const modalDescription = (t('plugin-deepl-translate:translateModalDescription') || 'Translate content from {{sourceLocale}} to:').replace('{{sourceLocale}}', locale?.code?.toUpperCase() ?? '');
    const cancelLabel = t('plugin-deepl-translate:cancelButton') || 'Cancel';
    const placeholder = t('plugin-deepl-translate:selectLocalesPlaceholder') || 'Select target locales...';
    return /*#__PURE__*/ _jsxs(_Fragment, {
        children: [
            /*#__PURE__*/ _jsx(Button, {
                buttonStyle: "secondary",
                disabled: isTranslating,
                onClick: handleOpen,
                children: isTranslating ? translatingLabel : translateLabel
            }),
            /*#__PURE__*/ _jsx(Modal, {
                className: "translate-modal",
                slug: MODAL_SLUG,
                children: /*#__PURE__*/ _jsxs("div", {
                    className: "translate-modal__wrapper",
                    children: [
                        /*#__PURE__*/ _jsxs("div", {
                            className: "translate-modal__content",
                            children: [
                                /*#__PURE__*/ _jsx("h3", {
                                    children: modalTitle
                                }),
                                /*#__PURE__*/ _jsx("p", {
                                    dangerouslySetInnerHTML: {
                                        __html: modalDescription
                                    }
                                }),
                                /*#__PURE__*/ _jsx("div", {
                                    className: "translate-modal__select",
                                    children: /*#__PURE__*/ _jsx(ReactSelect, {
                                        isMulti: true,
                                        onChange: (options)=>setSelectedLocales(options ?? []),
                                        options: localeOptions,
                                        placeholder: placeholder,
                                        value: selectedLocales
                                    })
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "translate-modal__controls",
                            children: [
                                /*#__PURE__*/ _jsx(Button, {
                                    buttonStyle: "secondary",
                                    onClick: handleCancel,
                                    size: "medium",
                                    children: cancelLabel
                                }),
                                /*#__PURE__*/ _jsx(Button, {
                                    disabled: selectedLocales.length === 0,
                                    onClick: handleTranslate,
                                    size: "medium",
                                    children: translateLabel
                                })
                            ]
                        })
                    ]
                })
            })
        ]
    });
};

//# sourceMappingURL=index.js.map