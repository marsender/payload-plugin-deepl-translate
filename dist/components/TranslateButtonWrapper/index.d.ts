import type { Payload } from 'payload';
type Props = {
    collectionSlug?: string;
    id?: number | string;
    payload?: Payload;
};
/**
 * Server component wrapper for the TranslateButton.
 * Evaluates the tenantFilter server-side (no client-side API call) and renders
 * the button only when translation is allowed for the current document's tenant.
 *
 * Registered per-collection with `serverProps: { collectionSlug }` so the
 * collection slug is baked in at config time, while `id` and `payload` are
 * injected by Payload's standard serverProps at render time.
 */
export declare const TranslateButtonWrapper: ({ collectionSlug, id, payload }: Props) => Promise<import("react/jsx-runtime").JSX.Element | null>;
export {};
//# sourceMappingURL=index.d.ts.map