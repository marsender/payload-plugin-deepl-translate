import type { Payload } from 'payload'

import { TranslateButton } from '../TranslateButton/index.js'

/**
 * Props received by this RSC come from two sources merged by Payload's
 * RenderServerComponent at render time:
 *
 * 1. Payload's standard serverProps (injected automatically for every admin component):
 *      id       — the document ID (undefined for unsaved documents)
 *      payload  — the Payload instance (gives access to config.custom, DB, etc.)
 *
 * 2. Component-level serverProps set at registration time in index.ts:
 *      collectionSlug — baked in per-collection so the RSC knows which collection
 *                       it is rendering without an extra lookup.
 *
 * @see RawPayloadComponent in payload/dist/config/types.d.ts
 * @see RenderServerComponent in @payloadcms/ui/elements/RenderServerComponent
 */
type Props = {
  collectionSlug?: string
  id?: number | string
  payload?: Payload
}

/**
 * Async React Server Component wrapper for TranslateButton.
 *
 * Runs the tenantFilter entirely server-side during page rendering so no
 * client-side API call is needed to decide whether to show the button.
 * Renders TranslateButton when translation is allowed, null otherwise.
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
