import type { Field } from 'payload';
import type { TranslatableField } from '../types.js';
/**
 * Recursively extract all localized text, textarea, and richText fields
 * from a Payload document, including fields nested inside groups,
 * arrays, blocks, and tabs.
 */
export declare function extractTranslatableFields(data: Record<string, unknown>, fields: Field[], basePath?: string, parentLocalized?: boolean): TranslatableField[];
//# sourceMappingURL=extractTranslatableFields.d.ts.map