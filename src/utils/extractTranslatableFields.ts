import type { Field } from 'payload'

import type { TranslatableField } from '../types.js'

/**
 * Recursively extract all localized text, textarea, and richText fields
 * from a Payload document, including fields nested inside groups,
 * arrays, blocks, and tabs.
 */
export function extractTranslatableFields(
  data: Record<string, unknown>,
  fields: Field[],
  basePath = '',
  parentLocalized = false,
): TranslatableField[] {
  const result: TranslatableField[] = []

  for (const field of fields) {
    // Layout fields without a name (row, collapsible) — recurse into their children
    if (!('name' in field)) {
      if ('fields' in field && Array.isArray(field.fields)) {
        result.push(...extractTranslatableFields(data, field.fields, basePath, parentLocalized))
      }
      if ('tabs' in field && Array.isArray(field.tabs)) {
        for (const tab of field.tabs) {
          if ('fields' in tab && Array.isArray(tab.fields)) {
            result.push(...extractTranslatableFields(data, tab.fields, basePath, parentLocalized))
          }
        }
      }
      continue
    }

    const fieldPath = basePath ? `${basePath}.${field.name}` : field.name
    const value = data[field.name]

    if (value === undefined || value === null) {
      continue
    }

    // A field is effectively localized when it is explicitly marked localized: true,
    // OR when it lives inside a localized container (parentLocalized = true).
    // The latter handles blocks/arrays/groups where the container is localized but
    // the individual sub-fields are not marked with their own localized flag.
    const isLocalized = parentLocalized || ('localized' in field && field.localized)

    // For non-localized container fields, still recurse to find localized children
    if (!isLocalized) {
      if (field.type === 'group' && 'fields' in field && typeof value === 'object') {
        result.push(
          ...extractTranslatableFields(value as Record<string, unknown>, field.fields, fieldPath),
        )
      }
      if (field.type === 'array' && 'fields' in field && Array.isArray(value)) {
        ;(value as unknown[]).forEach((item, index) => {
          if (item && typeof item === 'object' && !Array.isArray(item)) {
            result.push(
              ...extractTranslatableFields(
                item as Record<string, unknown>,
                field.fields,
                `${fieldPath}.${index}`,
              ),
            )
          }
        })
      }
      if (field.type === 'blocks' && 'blocks' in field && Array.isArray(value)) {
        ;(value as unknown[]).forEach((block, index) => {
          if (block && typeof block === 'object' && 'blockType' in block) {
            const blockConfig = field.blocks.find(
              (b) => b.slug === (block as Record<string, unknown>).blockType,
            )
            if (blockConfig) {
              result.push(
                ...extractTranslatableFields(
                  block as Record<string, unknown>,
                  blockConfig.fields,
                  `${fieldPath}.${index}`,
                ),
              )
            }
          }
        })
      }
      continue
    }

    // Process localized fields by type
    switch (field.type) {
      case 'text':
      case 'textarea':
        if (typeof value === 'string' && value.trim()) {
          result.push({ path: fieldPath, type: field.type, value })
        }
        break

      case 'richText':
        if (value && typeof value === 'object') {
          const textNodes = extractLexicalTextNodes(value)
          for (const node of textNodes) {
            if (node.text.trim()) {
              result.push({
                lexicalPath: node.path,
                path: fieldPath,
                type: 'richText',
                value: node.text,
              })
            }
          }
        }
        break

      case 'group':
        if ('fields' in field && typeof value === 'object') {
          result.push(
            ...extractTranslatableFields(
              value as Record<string, unknown>,
              field.fields,
              fieldPath,
              true,
            ),
          )
        }
        break

      case 'array':
        if ('fields' in field && Array.isArray(value)) {
          ;(value as unknown[]).forEach((item, index) => {
            if (item && typeof item === 'object' && !Array.isArray(item)) {
              result.push(
                ...extractTranslatableFields(
                  item as Record<string, unknown>,
                  field.fields,
                  `${fieldPath}.${index}`,
                  true,
                ),
              )
            }
          })
        }
        break

      case 'blocks':
        if ('blocks' in field && Array.isArray(value)) {
          ;(value as unknown[]).forEach((block, index) => {
            if (block && typeof block === 'object' && 'blockType' in block) {
              const blockConfig = field.blocks.find(
                (b) => b.slug === (block as Record<string, unknown>).blockType,
              )
              if (blockConfig) {
                result.push(
                  ...extractTranslatableFields(
                    block as Record<string, unknown>,
                    blockConfig.fields,
                    `${fieldPath}.${index}`,
                    true,
                  ),
                )
              }
            }
          })
        }
        break
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Lexical rich text helpers
// ---------------------------------------------------------------------------

interface LexicalNode {
  [key: string]: unknown
  children?: LexicalNode[]
  text?: string
  type?: string
}

interface LexicalTextNode {
  path: string
  text: string
}

/**
 * Walk a Lexical editor state and return all text nodes with their tree paths.
 * URL text nodes inside autolink nodes are skipped (should not be translated).
 */
function extractLexicalTextNodes(editorState: unknown): LexicalTextNode[] {
  const result: LexicalTextNode[] = []

  if (!editorState || typeof editorState !== 'object') {
    return result
  }

  const state = editorState as { root?: LexicalNode }
  if (!state.root) {
    return result
  }

  function traverse(node: LexicalNode, currentPath: string, parentType?: string): void {
    if (node.type === 'text' && typeof node.text === 'string') {
      // Skip URL text inside autolink nodes — never translate URLs
      if (parentType === 'autolink') {
        return
      }
      result.push({ path: currentPath, text: node.text })
    }
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child, index) => {
        traverse(child, `${currentPath}.children.${index}`, node.type)
      })
    }
  }

  traverse(state.root, 'root')
  return result
}
