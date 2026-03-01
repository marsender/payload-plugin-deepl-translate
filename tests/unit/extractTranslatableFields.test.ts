import { describe, expect, it } from 'vitest'

import { extractTranslatableFields } from '../../src/utils/extractTranslatableFields.js'

const textField = (name: string, localized = true) => ({
  name,
  type: 'text' as const,
  localized,
})

const textareaField = (name: string, localized = true) => ({
  name,
  type: 'textarea' as const,
  localized,
})

describe('extractTranslatableFields', () => {
  it('extracts a simple localized text field', () => {
    const fields = [textField('title')]
    const data = { title: 'Hello' }
    const result = extractTranslatableFields(data, fields)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ path: 'title', type: 'text', value: 'Hello' })
  })

  it('extracts a localized textarea field', () => {
    const fields = [textareaField('body')]
    const data = { body: 'Some text' }
    const result = extractTranslatableFields(data, fields)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ path: 'body', type: 'textarea', value: 'Some text' })
  })

  it('skips non-localized fields', () => {
    const fields = [textField('slug', false)]
    const data = { slug: 'hello-world' }
    const result = extractTranslatableFields(data, fields)
    expect(result).toHaveLength(0)
  })

  it('skips empty string values', () => {
    const fields = [textField('title')]
    const data = { title: '' }
    const result = extractTranslatableFields(data, fields)
    expect(result).toHaveLength(0)
  })

  it('skips whitespace-only values', () => {
    const fields = [textField('title')]
    const data = { title: '   ' }
    const result = extractTranslatableFields(data, fields)
    expect(result).toHaveLength(0)
  })

  it('skips null/undefined fields', () => {
    const fields = [textField('title')]
    const data = { title: null }
    const result = extractTranslatableFields(data, fields as never)
    expect(result).toHaveLength(0)
  })

  it('extracts fields from a non-localized group (recursing into children)', () => {
    const fields = [
      {
        name: 'meta',
        type: 'group' as const,
        localized: false,
        fields: [textField('description')],
      },
    ]
    const data = { meta: { description: 'A description' } }
    const result = extractTranslatableFields(data, fields)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ path: 'meta.description', value: 'A description' })
  })

  it('extracts fields from a non-localized array (recursing into items)', () => {
    const fields = [
      {
        name: 'items',
        type: 'array' as const,
        localized: false,
        fields: [textField('label')],
      },
    ]
    const data = { items: [{ label: 'One' }, { label: 'Two' }] }
    const result = extractTranslatableFields(data, fields)
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ path: 'items.0.label', value: 'One' })
    expect(result[1]).toMatchObject({ path: 'items.1.label', value: 'Two' })
  })

  it('extracts richText Lexical text nodes', () => {
    const fields = [
      {
        name: 'content',
        type: 'richText' as const,
        localized: true,
      },
    ]
    const data = {
      content: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: 'Hello world' },
              ],
            },
          ],
        },
      },
    }
    const result = extractTranslatableFields(data, fields as never)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      path: 'content',
      type: 'richText',
      value: 'Hello world',
    })
    expect(result[0].lexicalPath).toBeDefined()
  })

  it('skips autolink text nodes (URLs should not be translated)', () => {
    const fields = [
      {
        name: 'content',
        type: 'richText' as const,
        localized: true,
      },
    ]
    const data = {
      content: {
        root: {
          type: 'root',
          children: [
            {
              type: 'autolink',
              children: [{ type: 'text', text: 'https://example.com' }],
            },
          ],
        },
      },
    }
    const result = extractTranslatableFields(data, fields as never)
    expect(result).toHaveLength(0)
  })
})
