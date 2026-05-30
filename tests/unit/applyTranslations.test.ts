import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { applyTranslations, removeSystemFields } from '../../src/utils/applyTranslations.js'
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

describe('removeSystemFields', () => {
  it('strips top-level id, createdAt, updatedAt', () => {
    const result = removeSystemFields({
      id: 123,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-02',
      title: 'Hello',
    })
    expect(result).toEqual({ title: 'Hello' })
  })

  it('preserves item ids in non-localized arrays (shared across locales)', () => {
    // Reproduces the tags-translation bug: tags is an unlocalized array containing
    // a localized label. Item ids must survive so per-locale rows aren't orphaned.
    const fields: Field[] = [
      {
        name: 'tags',
        type: 'array',
        fields: [{ name: 'label', type: 'text', localized: true }],
      },
    ]
    const result = removeSystemFields(
      {
        id: 7,
        tags: [
          { id: 'tag-1', label: 'Yoga' },
          { id: 'tag-2', label: 'Pilates' },
        ],
      },
      fields,
    )
    expect(result).toEqual({
      tags: [
        { id: 'tag-1', label: 'Yoga' },
        { id: 'tag-2', label: 'Pilates' },
      ],
    })
  })

  it('strips item ids in localized arrays (per-locale structure)', () => {
    const fields: Field[] = [
      {
        name: 'links',
        type: 'array',
        localized: true,
        fields: [{ name: 'label', type: 'text' }],
      },
    ]
    const result = removeSystemFields(
      {
        links: [
          { id: 'l-1', label: 'Home' },
          { id: 'l-2', label: 'Shop' },
        ],
      },
      fields,
    )
    expect(result).toEqual({
      links: [{ label: 'Home' }, { label: 'Shop' }],
    })
  })

  it('strips block item ids in localized blocks fields', () => {
    const fields: Field[] = [
      {
        name: 'layout',
        type: 'blocks',
        localized: true,
        blocks: [
          {
            slug: 'hero',
            fields: [{ name: 'heading', type: 'text' }],
          },
        ],
      },
    ]
    const result = removeSystemFields(
      {
        layout: [{ id: 'b-1', blockType: 'hero', heading: 'Welcome' }],
      },
      fields,
    )
    expect(result).toEqual({
      layout: [{ blockType: 'hero', heading: 'Welcome' }],
    })
  })

  it('propagates localized context into nested arrays', () => {
    const fields: Field[] = [
      {
        name: 'sections',
        type: 'array',
        localized: true,
        fields: [
          {
            name: 'items',
            type: 'array',
            fields: [{ name: 'label', type: 'text' }],
          },
        ],
      },
    ]
    const result = removeSystemFields(
      {
        sections: [
          {
            id: 's-1',
            items: [
              { id: 'i-1', label: 'A' },
              { id: 'i-2', label: 'B' },
            ],
          },
        ],
      },
      fields,
    )
    // Both outer and inner item ids stripped because the outer array is localized
    expect(result).toEqual({
      sections: [{ items: [{ label: 'A' }, { label: 'B' }] }],
    })
  })

  it('recurses into named tabs without losing nested field info', () => {
    const fields: Field[] = [
      {
        type: 'tabs',
        tabs: [
          {
            name: 'meta',
            fields: [
              {
                name: 'tags',
                type: 'array',
                fields: [{ name: 'label', type: 'text', localized: true }],
              },
            ],
          },
        ],
      },
    ]
    const result = removeSystemFields(
      {
        meta: {
          tags: [{ id: 'mt-1', label: 'Important' }],
        },
      },
      fields,
    )
    expect(result).toEqual({
      meta: {
        tags: [{ id: 'mt-1', label: 'Important' }],
      },
    })
  })

  it('preserves Lexical rich text structures intact', () => {
    const lexicalState = {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'Hi', id: 'should-stay' }],
          },
        ],
      },
    }
    const result = removeSystemFields({
      id: 1,
      content: lexicalState,
    })
    expect(result.content).toBe(lexicalState)
  })
})
