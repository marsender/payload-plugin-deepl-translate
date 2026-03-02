/**
 * Integration tests for translateHandler.
 *
 * These tests exercise the full handler flow — request parsing, adapter call,
 * payload.findByID / payload.update — using a lightweight in-memory fake
 * instead of a real Payload + database.
 *
 * Live-DeepL path: set DEEPL_API_KEY in your environment (or a .env file
 * loaded by your shell) to run the optional real-API test.
 * Example: DEEPL_API_KEY=your-key pnpm test:int
 */
import { describe, expect, it, vi } from 'vitest'

import { translateHandler } from '../../src/endpoints/translateHandler.js'
import type { TranslationAdapter } from '../../src/adapters/types.js'

// ---------------------------------------------------------------------------
// Fake in-memory Payload store
// ---------------------------------------------------------------------------

type FieldConfig = { name: string; type: string; localized?: boolean; fields?: FieldConfig[] }

function makePayload(
  documents: Record<string, Record<string, unknown>>,
  fields: FieldConfig[],
  adapter: TranslationAdapter = makeFakeAdapter(),
) {
  const store: Record<string, Record<string, unknown>> = { ...documents }

  return {
    config: {
      custom: { translateAdapter: adapter },
    },
    collections: {
      pages: { config: { fields } },
    },
    findByID: vi.fn(async ({ id }: { id: string }) => store[id] ?? null),
    update: vi.fn(
      async ({
        id,
        data,
      }: {
        id: string
        data: Record<string, unknown>
        locale?: string
        overrideAccess?: boolean
        req?: unknown
      }) => {
        store[id] = { ...store[id], ...data }
        return store[id]
      },
    ),
    logger: { error: vi.fn() },
  }
}

function makeRequest(
  body: unknown,
  payload: ReturnType<typeof makePayload>,
  user: { id: string } | null = { id: 'user-1' },
) {
  return { user, payload, json: async () => body }
}

// ---------------------------------------------------------------------------
// Fake translation adapter — prefixes text so we can assert deterministically
// ---------------------------------------------------------------------------

function makeFakeAdapter(prefix = '[FR]'): TranslationAdapter {
  return {
    translate: vi.fn(async (text: string) => `${prefix} ${text}`),
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const textFields: FieldConfig[] = [{ name: 'title', type: 'text', localized: true }]

describe('translateHandler — auth & validation', () => {
  it('returns 401 when user is not authenticated', async () => {
    const payload = makePayload({}, textFields)
    const req = makeRequest({}, payload, null)
    const res = await translateHandler(req as never)
    expect(res.status).toBe(401)
  })

  it('returns 400 when body is missing required fields', async () => {
    const payload = makePayload({}, textFields)
    const req = makeRequest({ collection: 'pages' }, payload)
    const res = await translateHandler(req as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 when source and target locale are the same', async () => {
    const payload = makePayload({ 'doc-1': { id: 'doc-1', title: 'Hello' } }, textFields)
    const req = makeRequest(
      { collection: 'pages', documentId: 'doc-1', sourceLocale: 'en', targetLocales: ['en'] },
      payload,
    )
    const res = await translateHandler(req as never)
    expect(res.status).toBe(400)
  })

  it('returns 404 when document does not exist', async () => {
    const payload = makePayload({}, textFields)
    const req = makeRequest(
      { collection: 'pages', documentId: 'missing', sourceLocale: 'en', targetLocales: ['fr'] },
      payload,
    )
    const res = await translateHandler(req as never)
    expect(res.status).toBe(404)
  })
})

describe('translateHandler — translation flow (fake adapter)', () => {
  it('translates a text field and calls payload.update with the result', async () => {
    const adapter = makeFakeAdapter('[FR]')
    const payload = makePayload({ 'doc-1': { id: 'doc-1', title: 'Hello' } }, textFields, adapter)
    const req = makeRequest(
      { collection: 'pages', documentId: 'doc-1', sourceLocale: 'en', targetLocales: ['fr'] },
      payload,
    )

    const res = await translateHandler(req as never)
    const data = await res.json()

    expect(data.success).toBe(true)
    expect(data.translatedFields).toBe(1)
    expect(data.translatedLocales).toBe(1)

    expect(payload.update).toHaveBeenCalledOnce()
    const [updateArg] = payload.update.mock.calls[0]
    expect(updateArg.id).toBe('doc-1')
    expect(updateArg.locale).toBe('fr')
    expect(updateArg.data.title).toBe('[FR] Hello')
  })

  it('translates multiple fields in one request', async () => {
    const fields: FieldConfig[] = [
      { name: 'title', type: 'text', localized: true },
      { name: 'body', type: 'textarea', localized: true },
    ]
    const adapter = makeFakeAdapter('[DE]')
    const payload = makePayload(
      { 'doc-1': { id: 'doc-1', title: 'Hello', body: 'World' } },
      fields,
      adapter,
    )
    const req = makeRequest(
      { collection: 'pages', documentId: 'doc-1', sourceLocale: 'en', targetLocales: ['de'] },
      payload,
    )

    const res = await translateHandler(req as never)
    const data = await res.json()

    expect(data.translatedFields).toBe(2)
    const [updateArg] = payload.update.mock.calls[0]
    expect(updateArg.data.title).toBe('[DE] Hello')
    expect(updateArg.data.body).toBe('[DE] World')
  })

  it('translates to multiple target locales in one request', async () => {
    const adapter = makeFakeAdapter('[XX]')
    const payload = makePayload({ 'doc-1': { id: 'doc-1', title: 'Hello' } }, textFields, adapter)
    const req = makeRequest(
      { collection: 'pages', documentId: 'doc-1', sourceLocale: 'en', targetLocales: ['fr', 'de'] },
      payload,
    )

    const res = await translateHandler(req as never)
    const data = await res.json()

    expect(data.translatedLocales).toBe(2)
    expect(payload.update).toHaveBeenCalledTimes(2)
    expect(payload.update.mock.calls[0][0].locale).toBe('fr')
    expect(payload.update.mock.calls[1][0].locale).toBe('de')
  })

  it('translates localized fields inside a non-localized group (SEO meta scenario)', async () => {
    const fields: FieldConfig[] = [
      {
        name: 'meta',
        type: 'group',
        // no localized flag on the group itself — mirrors the SEO plugin's meta group
        fields: [
          { name: 'title', type: 'text', localized: true },
          { name: 'description', type: 'textarea', localized: true },
        ],
      },
    ]
    const adapter = makeFakeAdapter('[FR]')
    const payload = makePayload(
      { 'doc-1': { id: 'doc-1', meta: { title: 'Hello', description: 'World' } } },
      fields,
      adapter,
    )
    const req = makeRequest(
      { collection: 'pages', documentId: 'doc-1', sourceLocale: 'en', targetLocales: ['fr'] },
      payload,
    )

    const res = await translateHandler(req as never)
    const data = await res.json()

    expect(data.success).toBe(true)
    expect(data.translatedFields).toBe(2)
    const [updateArg] = payload.update.mock.calls[0]
    const meta = updateArg.data.meta as Record<string, string>
    expect(meta.title).toBe('[FR] Hello')
    expect(meta.description).toBe('[FR] World')
  })

  it('returns success with translatedFields=0 when no localized fields exist', async () => {
    const fields: FieldConfig[] = [{ name: 'slug', type: 'text', localized: false }]
    const payload = makePayload(
      { 'doc-1': { id: 'doc-1', slug: 'hello-world' } },
      fields,
    )
    const req = makeRequest(
      { collection: 'pages', documentId: 'doc-1', sourceLocale: 'en', targetLocales: ['fr'] },
      payload,
    )

    const res = await translateHandler(req as never)
    const data = await res.json()

    expect(data.success).toBe(true)
    expect(data.translatedFields).toBe(0)
    expect(payload.update).not.toHaveBeenCalled()
  })
})

describe('translateHandler — req forwarding and re-translation', () => {
  it('TR-002: forwards req and overrideAccess:true to payload.update', async () => {
    const adapter = makeFakeAdapter('[FR]')
    const payload = makePayload({ 'doc-1': { id: 'doc-1', title: 'Hello' } }, textFields, adapter)
    const req = makeRequest(
      { collection: 'pages', documentId: 'doc-1', sourceLocale: 'en', targetLocales: ['fr'] },
      payload,
    )

    await translateHandler(req as never)

    expect(payload.update).toHaveBeenCalledOnce()
    const [updateArg] = payload.update.mock.calls[0]
    expect(updateArg.req).toBe(req)
    expect(updateArg.overrideAccess).toBe(true)
  })

  it('TR-003: re-translating calls payload.update a second time', async () => {
    const adapter = makeFakeAdapter('[FR]')
    const payload = makePayload({ 'doc-1': { id: 'doc-1', title: 'Hello' } }, textFields, adapter)
    const body = { collection: 'pages', documentId: 'doc-1', sourceLocale: 'en', targetLocales: ['fr'] }

    await translateHandler(makeRequest(body, payload) as never)
    await translateHandler(makeRequest(body, payload) as never)

    expect(payload.update).toHaveBeenCalledTimes(2)
  })

  it('TR-005: continues with remaining locales when adapter fails for one locale', async () => {
    const adapter: TranslationAdapter = {
      translate: vi.fn(async (text: string, _src: string, target: string) => {
        if (target.toUpperCase() === 'DE') throw new Error('DeepL error')
        return `[FR] ${text}`
      }),
    }
    const payload = makePayload({ 'doc-1': { id: 'doc-1', title: 'Hello' } }, textFields, adapter)
    const req = makeRequest(
      { collection: 'pages', documentId: 'doc-1', sourceLocale: 'en', targetLocales: ['fr', 'de'] },
      payload,
    )

    const res = await translateHandler(req as never)
    const data = await res.json()

    expect(data.success).toBe(true)
    expect(data.translatedLocales).toBe(1)
    expect(payload.update).toHaveBeenCalledTimes(1)
    expect(payload.update.mock.calls[0][0].locale).toBe('fr')
  })
})

describe('translateHandler — live DeepL (skipped without DEEPL_API_KEY)', () => {
  it('calls the real DeepL API and saves the translation', async () => {
    const apiKey = process.env.DEEPL_API_KEY
    if (!apiKey) {
      console.log('  → Skipped: set DEEPL_API_KEY to run this test')
      return
    }

    const { DeepLAdapter } = await import('../../src/adapters/deepl.js')
    const adapter = new DeepLAdapter(apiKey)

    const payload = makePayload(
      { 'doc-1': { id: 'doc-1', title: 'Hello' } },
      textFields,
      adapter,
    )
    const req = makeRequest(
      { collection: 'pages', documentId: 'doc-1', sourceLocale: 'en', targetLocales: ['fr'] },
      payload,
    )

    const res = await translateHandler(req as never)
    const data = await res.json()

    expect(data.success).toBe(true)
    expect(payload.update).toHaveBeenCalledOnce()
    const [updateArg] = payload.update.mock.calls[0]
    // DeepL translates "Hello" to "Bonjour" (fr)
    expect(typeof updateArg.data.title).toBe('string')
    expect((updateArg.data.title as string).length).toBeGreaterThan(0)
  })
})
