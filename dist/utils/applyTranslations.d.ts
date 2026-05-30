import type { Field } from 'payload';
import type { TranslatableField } from '../types.js';
/**
 * Apply translated strings back onto a deep-cloned copy of the source document.
 * Each translation corresponds by index to the TranslatableField array.
 */
export declare function applyTranslations(originalData: Record<string, unknown>, fields: TranslatableField[], translations: string[]): Record<string, unknown>;
/**
 * Recursively remove Payload system fields (createdAt, updatedAt, top-level id)
 * from the data before saving via payload.update().
 *
 * Array/block item IDs are preserved unless the array/blocks field is `localized: true`
 * (or sits inside a localized container). Reason: in Payload, unlocalized arrays that
 * contain localized children share the array structure across locales — the item IDs
 * are the join key for per-locale values. Stripping those IDs makes Payload regenerate
 * them on update and orphans the rows in the other locale.
 *
 * Preserves Lexical rich text structures intact (they contain internal node IDs that must stay).
 */
export declare function removeSystemFields(obj: Record<string, unknown>, collectionFields?: Field[]): Record<string, unknown>;
//# sourceMappingURL=applyTranslations.d.ts.map