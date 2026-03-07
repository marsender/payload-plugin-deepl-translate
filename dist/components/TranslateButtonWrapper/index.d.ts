import type { Payload } from 'payload';
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
    collectionSlug?: string;
    id?: number | string;
    payload?: Payload;
};
/**
 * Async React Server Component wrapper for TranslateButton.
 *
 * Runs the tenantFilter entirely server-side during page rendering so no
 * client-side API call is needed to decide whether to show the button.
 * Renders TranslateButton when translation is allowed, null otherwise.
 */
export declare const TranslateButtonWrapper: ({ collectionSlug, id, payload }: Props) => Promise<import("react/jsx-runtime").JSX.Element | null>;
export {};
//# sourceMappingURL=index.d.ts.map