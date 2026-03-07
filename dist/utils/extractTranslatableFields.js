/**
 * Recursively extract all localized text, textarea, and richText fields
 * from a Payload document, including fields nested inside groups,
 * arrays, blocks, and tabs.
 */ export function extractTranslatableFields(data, fields, basePath = '', parentLocalized = false) {
    const result = [];
    for (const field of fields){
        // Layout fields without a name (row, collapsible) — recurse into their children
        if (!('name' in field)) {
            if ('fields' in field && Array.isArray(field.fields)) {
                result.push(...extractTranslatableFields(data, field.fields, basePath, parentLocalized));
            }
            if ('tabs' in field && Array.isArray(field.tabs)) {
                for (const tab of field.tabs){
                    if ('fields' in tab && Array.isArray(tab.fields)) {
                        // Named tabs store their data nested under the tab name (e.g. tab.name = 'seo'
                        // → document.seo.fieldName). Unnamed tabs store data at document root.
                        const tabName = 'name' in tab ? String(tab.name) : null;
                        const tabData = tabName != null ? data[tabName] : data;
                        const tabPath = tabName != null ? basePath ? `${basePath}.${tabName}` : tabName : basePath;
                        if (tabData == null) continue;
                        result.push(...extractTranslatableFields(tabData, tab.fields, tabPath, parentLocalized));
                    }
                }
            }
            continue;
        }
        const fieldPath = basePath ? `${basePath}.${field.name}` : field.name;
        const value = data[field.name];
        if (value === undefined || value === null) {
            continue;
        }
        // A field is effectively localized when it is explicitly marked localized: true,
        // OR when it lives inside a localized container (parentLocalized = true).
        // The latter handles blocks/arrays/groups where the container is localized but
        // the individual sub-fields are not marked with their own localized flag.
        const isLocalized = parentLocalized || 'localized' in field && field.localized;
        // For non-localized container fields, still recurse to find localized children
        if (!isLocalized) {
            if (field.type === 'group' && 'fields' in field && typeof value === 'object') {
                result.push(...extractTranslatableFields(value, field.fields, fieldPath));
            }
            if (field.type === 'array' && 'fields' in field && Array.isArray(value)) {
                ;
                value.forEach((item, index)=>{
                    if (item && typeof item === 'object' && !Array.isArray(item)) {
                        result.push(...extractTranslatableFields(item, field.fields, `${fieldPath}.${index}`));
                    }
                });
            }
            if (field.type === 'blocks' && 'blocks' in field && Array.isArray(value)) {
                ;
                value.forEach((block, index)=>{
                    if (block && typeof block === 'object' && 'blockType' in block) {
                        const blockConfig = field.blocks.find((b)=>b.slug === block.blockType);
                        if (blockConfig) {
                            result.push(...extractTranslatableFields(block, blockConfig.fields, `${fieldPath}.${index}`));
                        }
                    }
                });
            }
            continue;
        }
        // Process localized fields by type
        switch(field.type){
            case 'text':
            case 'textarea':
                if (typeof value === 'string' && value.trim()) {
                    result.push({
                        path: fieldPath,
                        type: field.type,
                        value
                    });
                }
                break;
            case 'richText':
                if (value && typeof value === 'object') {
                    const textNodes = extractLexicalTextNodes(value);
                    for (const node of textNodes){
                        if (node.text.trim()) {
                            result.push({
                                lexicalPath: node.path,
                                path: fieldPath,
                                type: 'richText',
                                value: node.text
                            });
                        }
                    }
                }
                break;
            case 'group':
                if ('fields' in field && typeof value === 'object') {
                    result.push(...extractTranslatableFields(value, field.fields, fieldPath, true));
                }
                break;
            case 'array':
                if ('fields' in field && Array.isArray(value)) {
                    ;
                    value.forEach((item, index)=>{
                        if (item && typeof item === 'object' && !Array.isArray(item)) {
                            result.push(...extractTranslatableFields(item, field.fields, `${fieldPath}.${index}`, true));
                        }
                    });
                }
                break;
            case 'blocks':
                if ('blocks' in field && Array.isArray(value)) {
                    ;
                    value.forEach((block, index)=>{
                        if (block && typeof block === 'object' && 'blockType' in block) {
                            const blockConfig = field.blocks.find((b)=>b.slug === block.blockType);
                            if (blockConfig) {
                                result.push(...extractTranslatableFields(block, blockConfig.fields, `${fieldPath}.${index}`, true));
                            }
                        }
                    });
                }
                break;
        }
    }
    return result;
}
/**
 * Walk a Lexical editor state and return all text nodes with their tree paths.
 * URL text nodes inside autolink nodes are skipped (should not be translated).
 */ function extractLexicalTextNodes(editorState) {
    const result = [];
    if (!editorState || typeof editorState !== 'object') {
        return result;
    }
    const state = editorState;
    if (!state.root) {
        return result;
    }
    function traverse(node, currentPath, parentType) {
        if (node.type === 'text' && typeof node.text === 'string') {
            // Skip URL text inside autolink nodes — never translate URLs
            if (parentType === 'autolink') {
                return;
            }
            result.push({
                path: currentPath,
                text: node.text
            });
        }
        if (node.children && Array.isArray(node.children)) {
            node.children.forEach((child, index)=>{
                traverse(child, `${currentPath}.children.${index}`, node.type);
            });
        }
    }
    traverse(state.root, 'root');
    return result;
}

//# sourceMappingURL=extractTranslatableFields.js.map