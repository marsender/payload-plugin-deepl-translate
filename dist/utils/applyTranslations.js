/**
 * Apply translated strings back onto a deep-cloned copy of the source document.
 * Each translation corresponds by index to the TranslatableField array.
 */ export function applyTranslations(originalData, fields, translations) {
    const result = JSON.parse(JSON.stringify(originalData));
    fields.forEach((field, index)=>{
        const translation = translations[index];
        if (translation === undefined) {
            return;
        }
        if (field.type === 'richText' && field.lexicalPath) {
            applyLexicalTranslation(result, field.path, field.lexicalPath, translation);
        } else {
            setNestedValue(result, field.path, translation);
        }
    });
    return result;
}
/**
 * Navigate to a specific text node within a Lexical editor state and
 * update its `text` property in-place.
 */ function applyLexicalTranslation(data, fieldPath, lexicalPath, translation) {
    const lexicalState = getNestedValue(data, fieldPath);
    if (!lexicalState || typeof lexicalState !== 'object') {
        return;
    }
    const pathParts = lexicalPath.split('.');
    let current = lexicalState;
    for(let i = 0; i < pathParts.length - 1; i++){
        const key = pathParts[i];
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return; // path not found
        }
    }
    // `current` is now the parent of the text node; set the last key's `text` property
    const lastKey = pathParts[pathParts.length - 1];
    if (current && typeof current === 'object' && lastKey in current) {
        const textNode = current[lastKey];
        if (textNode && typeof textNode === 'object' && 'text' in textNode) {
            ;
            textNode.text = translation;
        }
    }
}
function getNestedValue(obj, path) {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys){
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return undefined;
        }
    }
    return current;
}
function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    for(let i = 0; i < keys.length - 1; i++){
        const key = keys[i];
        const nextKey = keys[i + 1];
        if (!(key in current)) {
            current[key] = isNaN(Number(nextKey)) ? {} : [];
        }
        current = current[key];
    }
    current[keys[keys.length - 1]] = value;
}
/**
 * Recursively remove Payload system fields (createdAt, updatedAt, top-level id)
 * from the data before saving via payload.update().
 * Preserves Lexical rich text structures intact (they contain internal IDs that must stay).
 */ export function removeSystemFields(obj, isTopLevel = true) {
    const result = {};
    for (const [key, value] of Object.entries(obj)){
        if (key === 'createdAt' || key === 'updatedAt') {
            continue;
        }
        // Remove id only at top level (document ID), not within nested structures
        if (isTopLevel && key === 'id') {
            continue;
        }
        if (Array.isArray(value)) {
            result[key] = value.map((item)=>{
                if (item && typeof item === 'object' && !Array.isArray(item)) {
                    return removeSystemFields(item, false);
                }
                return item;
            });
        } else if (value && typeof value === 'object') {
            if (isLexicalState(value)) {
                // Preserve Lexical structures intact — they contain internal node IDs
                result[key] = value;
            } else {
                result[key] = removeSystemFields(value, false);
            }
        } else {
            result[key] = value;
        }
    }
    return result;
}
function isLexicalState(obj) {
    return 'root' in obj && typeof obj.root === 'object' && obj.root !== null && 'children' in obj.root;
}

//# sourceMappingURL=applyTranslations.js.map