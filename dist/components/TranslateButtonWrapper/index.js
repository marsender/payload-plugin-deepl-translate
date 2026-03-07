import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { TranslateButton } from '../TranslateButton/index.js';
/**
 * Server component wrapper for the TranslateButton.
 * Evaluates the tenantFilter server-side (no client-side API call) and renders
 * the button only when translation is allowed for the current document's tenant.
 *
 * Registered per-collection with `serverProps: { collectionSlug }` so the
 * collection slug is baked in at config time, while `id` and `payload` are
 * injected by Payload's standard serverProps at render time.
 */ export const TranslateButtonWrapper = async ({ collectionSlug, id, payload })=>{
    if (!id || !collectionSlug || !payload) return null;
    const custom = payload.config.custom;
    const tenantFilter = custom?.translateTenantsFilter;
    if (tenantFilter) {
        const tenantFieldName = custom?.translateTenantField ?? 'tenant';
        try {
            const doc = await payload.findByID({
                id,
                collection: collectionSlug,
                depth: 0,
                overrideAccess: true
            });
            const tenantRaw = doc?.[tenantFieldName];
            const tenantId = tenantRaw != null ? typeof tenantRaw === 'object' ? tenantRaw.id ?? tenantRaw.value ?? null : String(tenantRaw) : null;
            const allowed = await tenantFilter(tenantId, payload);
            if (!allowed) return null;
        } catch  {
            return null;
        }
    }
    return /*#__PURE__*/ _jsx(TranslateButton, {});
};

//# sourceMappingURL=index.js.map