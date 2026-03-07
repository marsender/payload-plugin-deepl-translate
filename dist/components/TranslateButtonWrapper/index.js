import { jsx as _jsx } from "react/jsx-runtime";
import { TranslateButton } from '../TranslateButton/index.js';
/**
 * Async React Server Component wrapper for TranslateButton.
 *
 * Runs the tenantFilter entirely server-side during page rendering so no
 * client-side API call is needed to decide whether to show the button.
 * Renders TranslateButton when translation is allowed, null otherwise.
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