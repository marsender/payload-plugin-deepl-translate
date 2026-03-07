/**
 * GET /api/translate-check?collection=<slug>&id=<documentId>
 *
 * Evaluates the `tenantFilter` function (configured in the plugin) against the
 * current document's tenant and returns `{ allowed: boolean }`.
 * Used by the TranslateButton client component to decide whether to show itself.
 */ export const translateCheckHandler = async (req)=>{
    if (!req.user) {
        return Response.json({
            allowed: false
        }, {
            status: 401
        });
    }
    if (!req.url) {
        return Response.json({
            allowed: false,
            error: 'Missing URL'
        }, {
            status: 400
        });
    }
    const url = new URL(req.url, 'http://localhost');
    const collection = url.searchParams.get('collection');
    const id = url.searchParams.get('id');
    if (!collection || !id) {
        return Response.json({
            allowed: false,
            error: 'Missing parameters'
        }, {
            status: 400
        });
    }
    const { payload } = req;
    const custom = payload.config.custom;
    const tenantFilter = custom?.translateTenantsFilter;
    // No filter configured — translation is enabled for all tenants
    if (!tenantFilter) {
        return Response.json({
            allowed: true
        });
    }
    try {
        const doc = await payload.findByID({
            id,
            collection,
            depth: 0,
            overrideAccess: false,
            req
        });
        const tenantFieldName = custom?.translateTenantField ?? 'tenant';
        const tenantRaw = doc?.[tenantFieldName];
        const tenantId = tenantRaw != null ? typeof tenantRaw === 'object' ? tenantRaw.id ?? tenantRaw.value ?? null : String(tenantRaw) : null;
        const allowed = await tenantFilter(tenantId, payload);
        return Response.json({
            allowed
        });
    } catch (_error) {
        return Response.json({
            allowed: false
        }, {
            status: 500
        });
    }
};

//# sourceMappingURL=translateCheckHandler.js.map