import type { Payload, PayloadHandler, PayloadRequest } from 'payload'

import type { TranslationUsage } from '../types.js'

type TenantFilter = (
  tenantId: string | null,
  payload: Payload,
  req?: PayloadRequest,
) => boolean | Promise<boolean>

type UsageProvider = (
  tenantId: string | null,
  payload: Payload,
  req?: PayloadRequest,
) => Promise<TranslationUsage | null> | TranslationUsage | null

/**
 * GET /api/translate-check?collection=<slug>&id=<documentId>
 *
 * Evaluates the `tenantFilter` function (configured in the plugin) against the current document's
 * tenant and returns `{ allowed: boolean, usage?: { used, max } }`. When a `usageProvider` is
 * configured, the month-to-date translation usage is included so the Translate modal can render a
 * progress bar. Used by the TranslateButton client component when the modal opens.
 */
export const translateCheckHandler: PayloadHandler = async (req) => {
  if (!req.user) {
    return Response.json({ allowed: false }, { status: 401 })
  }

  if (!req.url) {
    return Response.json({ allowed: false, error: 'Missing URL' }, { status: 400 })
  }

  const url = new URL(req.url, 'http://localhost')
  const collection = url.searchParams.get('collection')
  const id = url.searchParams.get('id')

  if (!collection || !id) {
    return Response.json({ allowed: false, error: 'Missing parameters' }, { status: 400 })
  }

  const { payload } = req
  const custom = payload.config.custom as Record<string, unknown> | undefined
  const tenantFilter = custom?.translateTenantsFilter as TenantFilter | null | undefined
  const usageProvider = custom?.translateUsageProvider as UsageProvider | null | undefined

  // Nothing to resolve — translation is enabled for all tenants and there is no usage to report.
  if (!tenantFilter && !usageProvider) {
    return Response.json({ allowed: true })
  }

  try {
    const doc = await payload.findByID({
      id,
      collection,
      depth: 0,
      overrideAccess: false,
      req,
    })

    const tenantFieldName = (custom?.translateTenantField as string | undefined) ?? 'tenant'
    const tenantRaw = (doc as Record<string, unknown>)?.[tenantFieldName]
    const tenantId =
      tenantRaw != null
        ? typeof tenantRaw === 'object'
          ? ((tenantRaw as { id?: string; value?: string }).id ??
            (tenantRaw as { id?: string; value?: string }).value ??
            null)
          : String(tenantRaw)
        : null

    const allowed = tenantFilter ? await tenantFilter(tenantId, payload, req) : true
    const usage = usageProvider ? ((await usageProvider(tenantId, payload, req)) ?? undefined) : undefined
    return Response.json({ allowed, usage })
  } catch (_error) {
    return Response.json({ allowed: false }, { status: 500 })
  }
}
