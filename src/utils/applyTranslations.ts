import type { Field } from 'payload'

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
 *
 * Array/block item IDs are preserved unless the array/blocks field is `localized: true`
 * (or sits inside a localized container). Reason: in Payload, unlocalized arrays that
 * contain localized children share the array structure across locales — the item IDs
 * are the join key for per-locale values. Stripping those IDs makes Payload regenerate
 * them on update and orphans the rows in the other locale.
 *
 * Preserves Lexical rich text structures intact (they contain internal node IDs that must stay).
 */
export function removeSystemFields(
  obj: Record<string, unknown>,
  collectionFields?: Field[],
): Record<string, unknown> {
  const { createdAt: _ca, id: _id, updatedAt: _ua, ...rest } = obj
  void _ca
  void _id
  void _ua
  return cleanLevel(rest, collectionFields, false)
}

function cleanLevel(
  obj: Record<string, unknown>,
  fields: Field[] | undefined,
  inLocalizedContext: boolean,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const fieldMap = collectNamedFields(fields ?? [])

  for (const [key, value] of Object.entries(obj)) {
    if (key === 'createdAt' || key === 'updatedAt') {
      continue
    }
    // Strip array item ids only when items are locale-specific (parent array is
    // localized, or we're already inside a localized container).
    if (key === 'id' && inLocalizedContext) {
      continue
    }

    const field = fieldMap.get(key)

    if (Array.isArray(value)) {
      const fieldIsLocalized =
        field != null && 'localized' in field && field.localized === true
      const childLocalized = inLocalizedContext || fieldIsLocalized

      result[key] = value.map((item) => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          let childFields: Field[] | undefined
          if (field?.type === 'array' && 'fields' in field) {
            childFields = field.fields
          } else if (field?.type === 'blocks' && 'blocks' in field) {
            const blockType = (item as Record<string, unknown>).blockType
            childFields = field.blocks.find((b) => b.slug === blockType)?.fields
          }
          return cleanLevel(item as Record<string, unknown>, childFields, childLocalized)
        }
        return item
      })
    } else if (value && typeof value === 'object') {
      if (isLexicalState(value as Record<string, unknown>)) {
        result[key] = value
      } else {
        let childFields: Field[] | undefined
        if (field?.type === 'group' && 'fields' in field) {
          childFields = field.fields
        }
        result[key] = cleanLevel(value as Record<string, unknown>, childFields, inLocalizedContext)
      }
    } else {
      result[key] = value
    }
  }

  return result
}

/**
 * Build a flat map of named field configs, recursing through unnamed layout
 * wrappers (row, collapsible) and tabs. Named tabs nest their data under the
 * tab name in the document, so we model them as a synthetic group field.
 */
function collectNamedFields(fields: Field[]): Map<string, Field> {
  const map = new Map<string, Field>()
  for (const field of fields) {
    if ('name' in field) {
      map.set(field.name, field)
      continue
    }
    if ('fields' in field && Array.isArray(field.fields)) {
      for (const [k, v] of collectNamedFields(field.fields)) {
        map.set(k, v)
      }
    }
    if ('tabs' in field && Array.isArray(field.tabs)) {
      for (const tab of field.tabs) {
        if ('name' in tab && tab.name && 'fields' in tab && Array.isArray(tab.fields)) {
          map.set(String(tab.name), {
            name: String(tab.name),
            type: 'group',
            fields: tab.fields,
          } as unknown as Field)
        } else if ('fields' in tab && Array.isArray(tab.fields)) {
          for (const [k, v] of collectNamedFields(tab.fields)) {
            map.set(k, v)
          }
        }
      }
    }
  }
  return map
}

function isLexicalState(obj: Record<string, unknown>): boolean {
  return (
    'root' in obj &&
    typeof obj.root === 'object' &&
    obj.root !== null &&
    'children' in (obj.root as Record<string, unknown>)
  )
}
