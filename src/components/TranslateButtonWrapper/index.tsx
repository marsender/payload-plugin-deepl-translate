import type { Payload } from 'payload'

import React from 'react'

import { TranslateButton } from '../TranslateButton/index.js'

type Props = {
  collectionSlug?: string
  id?: number | string
  payload?: Payload
}

/**
 * Server component wrapper for the TranslateButton.
 * Evaluates the tenantFilter server-side (no client-side API call) and renders
 * the button only when translation is allowed for the current document's tenant.
 *
 * Registered per-collection with `serverProps: { collectionSlug }` so the
 * collection slug is baked in at config time, while `id` and `payload` are
 * injected by Payload's standard serverProps at render time.
 */
export const TranslateButtonWrapper = async ({ collectionSlug, id, payload }: Props) => {
  if (!id || !collectionSlug || !payload) return null

  const custom = payload.config.custom as Record<string, unknown> | undefined
  const tenantFilter = custom?.translateTenantsFilter as
    | ((tenantId: string | null, payload: Payload) => boolean | Promise<boolean>)
    | null
    | undefined

  if (tenantFilter) {
    const tenantFieldName = (custom?.translateTenantField as string | undefined) ?? 'tenant'

    try {
      const doc = await payload.findByID({
        id,
        collection: collectionSlug,
        depth: 0,
        overrideAccess: true,
      })

      const tenantRaw = (doc as Record<string, unknown>)?.[tenantFieldName]
      const tenantId =
        tenantRaw != null
          ? typeof tenantRaw === 'object'
            ? ((tenantRaw as { id?: string; value?: string }).id ??
              (tenantRaw as { id?: string; value?: string }).value ??
              null)
            : String(tenantRaw)
          : null

      const allowed = await tenantFilter(tenantId, payload)
      if (!allowed) return null
    } catch {
      return null
    }
  }

  return <TranslateButton />
}
