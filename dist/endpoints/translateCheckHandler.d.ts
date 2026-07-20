import type { PayloadHandler } from 'payload';
/**
 * GET /api/translate-check?collection=<slug>&id=<documentId>
 *
 * Evaluates the `tenantFilter` function (configured in the plugin) against the current document's
 * tenant and returns `{ allowed: boolean, usage?: { used, max } }`. When a `usageProvider` is
 * configured, the month-to-date translation usage is included so the Translate modal can render a
 * progress bar. Used by the TranslateButton client component when the modal opens.
 */
export declare const translateCheckHandler: PayloadHandler;
//# sourceMappingURL=translateCheckHandler.d.ts.map