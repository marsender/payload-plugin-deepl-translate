import { describe, expect, it } from 'vitest'

import { applyTranslations } from '../../src/utils/applyTranslations.js'
import type { TranslatableField } from '../../src/types.js'

describe('applyTranslations', () => {
  it('applies a text field translation', () => {
    const data = { title: 'Hello' }
    const fields: TranslatableField[] = [{ path: 'title', type: 'text', value: 'Hello' }]
    const result = applyTranslations(data, fields, ['Bonjour'])
    expect(result.title).toBe('Bonjour')
  })

  it('applies a textarea field translation', () => {
    const data = { body: 'Original text' }
    const fields: TranslatableField[] = [{ path: 'body', type: 'textarea', value: 'Original text' }]
    const result = applyTranslations(data, fields, ['Texte original'])
    expect(result.body).toBe('Texte original')
  })

  it('does not mutate the original data', () => {
    const data = { title: 'Hello' }
    const fields: TranslatableField[] = [{ path: 'title', type: 'text', value: 'Hello' }]
    applyTranslations(data, fields, ['Bonjour'])
    expect(data.title).toBe('Hello')
  })

  it('applies multiple field translations', () => {
    const data = { title: 'Hello', body: 'World' }
    const fields: TranslatableField[] = [
      { path: 'title', type: 'text', value: 'Hello' },
      { path: 'body', type: 'textarea', value: 'World' },
    ]
    const result = applyTranslations(data, fields, ['Bonjour', 'Monde'])
    expect(result.title).toBe('Bonjour')
    expect(result.body).toBe('Monde')
  })

  it('skips fields with no corresponding translation', () => {
    const data = { title: 'Hello', body: 'World' }
    const fields: TranslatableField[] = [
      { path: 'title', type: 'text', value: 'Hello' },
      { path: 'body', type: 'textarea', value: 'World' },
    ]
    // Only one translation provided — body should remain unchanged
    const result = applyTranslations(data, fields, ['Bonjour'])
    expect(result.title).toBe('Bonjour')
    expect(result.body).toBe('World')
  })

  it('applies a nested field translation via dot-notation path', () => {
    const data = { meta: { description: 'Original' } }
    const fields: TranslatableField[] = [
      { path: 'meta.description', type: 'text', value: 'Original' },
    ]
    const result = applyTranslations(data, fields, ['Traduit'])
    expect((result.meta as Record<string, unknown>).description).toBe('Traduit')
  })

  it('applies richText Lexical text node translation', () => {
    const data = {
      content: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', text: 'Hello' }],
            },
          ],
        },
      },
    }
    const fields: TranslatableField[] = [
      {
        lexicalPath: 'root.children.0.children.0',
        path: 'content',
        type: 'richText',
        value: 'Hello',
      },
    ]
    const result = applyTranslations(data, fields, ['Bonjour'])
    const paragraph = (result.content as Record<string, unknown>).root as Record<string, unknown>
    const children = paragraph.children as Record<string, unknown>[]
    const textNode = (children[0].children as Record<string, unknown>[])[0]
    expect(textNode.text).toBe('Bonjour')
  })
})
