import type { TranslatableField } from '../types.js';
/**
 * Apply translated strings back onto a deep-cloned copy of the source document.
 * Each translation corresponds by index to the TranslatableField array.
 */
export declare function applyTranslations(originalData: Record<string, unknown>, fields: TranslatableField[], translations: string[]): Record<string, unknown>;
/**
 * Recursively remove Payload system fields (createdAt, updatedAt, top-level id)
 * from the data before saving via payload.update().
 * Preserves Lexical rich text structures intact (they contain internal IDs that must stay).
 */
export declare function removeSystemFields(obj: Record<string, unknown>): Record<string, unknown>;
//# sourceMappingURL=applyTranslations.d.ts.map