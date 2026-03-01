import type { TranslatableField } from '../types.js'

/**
 * Apply translated strings back onto a deep-cloned copy of the source document.
 * Each translation corresponds by index to the TranslatableField array.
 */
export function applyTranslations(
  originalData: Record<string, unknown>,
  fields: TranslatableField[],
  translations: string[],
): Record<string, unknown> {
  const result = JSON.parse(JSON.stringify(originalData)) as Record<string, unknown>

  fields.forEach((field, index) => {
    const translation = translations[index]
    if (translation === undefined) {
      return
    }

    if (field.type === 'richText' && field.lexicalPath) {
      applyLexicalTranslation(result, field.path, field.lexicalPath, translation)
    } else {
      setNestedValue(result, field.path, translation)
    }
  })

  return result
}

/**
 * Navigate to a specific text node within a Lexical editor state and
 * update its `text` property in-place.
 */
function applyLexicalTranslation(
  data: Record<string, unknown>,
  fieldPath: string,
  lexicalPath: string,
  translation: string,
): void {
  const lexicalState = getNestedValue(data, fieldPath)
  if (!lexicalState || typeof lexicalState !== 'object') {
    return
  }

  const pathParts = lexicalPath.split('.')
  let current: unknown = lexicalState

  for (let i = 0; i < pathParts.length - 1; i++) {
    const key = pathParts[i]
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return // path not found
    }
  }

  // `current` is now the parent of the text node; set the last key's `text` property
  const lastKey = pathParts[pathParts.length - 1]
  if (current && typeof current === 'object' && lastKey in current) {
    const textNode = (current as Record<string, unknown>)[lastKey]
    if (textNode && typeof textNode === 'object' && 'text' in textNode) {
      ;(textNode as Record<string, unknown>).text = translation
    }
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return undefined
    }
  }
  return current
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.')
  let current: Record<string, unknown> = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    const nextKey = keys[i + 1]
    if (!(key in current)) {
      current[key] = isNaN(Number(nextKey)) ? {} : []
    }
    current = current[key] as Record<string, unknown>
  }

  current[keys[keys.length - 1]] = value
}

/**
 * Recursively remove Payload system fields (createdAt, updatedAt, top-level id)
 * from the data before saving via payload.update().
 * Preserves Lexical rich text structures intact (they contain internal IDs that must stay).
 */
export function removeSystemFields(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (key === 'createdAt' || key === 'updatedAt') {
      continue
    }
    // Remove id at all levels: top-level document ID and nested block/array item IDs.
    // For localized blocks/arrays (e.g. layout, hero.links), when updating a target locale
    // the source-locale block IDs do not exist in the target locale and fail Payload validation.
    // Stripping all ids lets Payload auto-generate fresh ones for the target locale.
    if (key === 'id') {
      continue
    }

    if (Array.isArray(value)) {
      result[key] = value.map((item) => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          return removeSystemFields(item as Record<string, unknown>)
        }
        return item
      })
    } else if (value && typeof value === 'object') {
      if (isLexicalState(value as Record<string, unknown>)) {
        // Preserve Lexical structures intact — they contain internal node IDs
        result[key] = value
      } else {
        result[key] = removeSystemFields(value as Record<string, unknown>)
      }
    } else {
      result[key] = value
    }
  }

  return result
}

function isLexicalState(obj: Record<string, unknown>): boolean {
  return (
    'root' in obj &&
    typeof obj.root === 'object' &&
    obj.root !== null &&
    'children' in (obj.root as Record<string, unknown>)
  )
}
