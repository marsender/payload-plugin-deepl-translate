import type { PayloadHandler } from 'payload';
/**
 * GET /api/translate-check?collection=<slug>&id=<documentId>
 *
 * Evaluates the `tenantFilter` function (configured in the plugin) against the
 * current document's tenant and returns `{ allowed: boolean }`.
 * Used by the TranslateButton client component to decide whether to show itself.
 */
export declare const translateCheckHandler: PayloadHandler;
//# sourceMappingURL=translateCheckHandler.d.ts.map