import type { PayloadHandler } from 'payload'

/**
 * GET /api/translate-check?collection=<slug>&id=<documentId>
 *
 * Evaluates the `tenantFilter` function (configured in the plugin) against the
 * current document's tenant and returns `{ allowed: boolean }`.
 * Used by the TranslateButton client component to decide whether to show itself.
 */
export const translateCheckHandler: PayloadHandler = async (req) => {
  if (!req.user) {
    return Response.json({ allowed: false }, { status: 401 })
  }

  const url = new URL(req.url ?? '/', 'http://localhost')
  const collection = url.searchParams.get('collection')
  const id = url.searchParams.get('id')

  if (!collection || !id) {
    return Response.json({ allowed: false, error: 'Missing parameters' }, { status: 400 })
  }

  const { payload } = req
  const custom = payload.config.custom as Record<string, unknown> | undefined
  const tenantFilter = custom?.translateTenantsFilter as
    | ((tenantId: string | null) => boolean | Promise<boolean>)
    | null
    | undefined

  // No filter configured — translation is enabled for all tenants
  if (!tenantFilter) {
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

    const allowed = await tenantFilter(tenantId)
    return Response.json({ allowed })
  } catch (_error) {
    return Response.json({ allowed: false }, { status: 500 })
  }
}
