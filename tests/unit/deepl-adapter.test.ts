import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock deepl-node before importing the adapter
vi.mock('deepl-node', () => ({
  DeepLClient: vi.fn().mockImplementation(() => ({
    translateText: vi.fn().mockResolvedValue({ text: 'Bonjour' }),
  })),
}))

import { DeepLAdapter, createDeepLAdapter } from '../../src/adapters/deepl.js'
import * as deepl from 'deepl-node'

describe('DeepLAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls translateText with uppercased language codes', async () => {
    const adapter = new DeepLAdapter('test-key:fx')
    const result = await adapter.translate('Hello', 'en', 'fr')

    const mockClient = vi.mocked(deepl.DeepLClient).mock.results[0].value as {
      translateText: ReturnType<typeof vi.fn>
    }
    expect(mockClient.translateText).toHaveBeenCalledWith('Hello', 'EN', 'FR')
    expect(result).toBe('Bonjour')
  })

  it('strips regional subtag from source lang (e.g. en-US → EN)', async () => {
    const adapter = new DeepLAdapter('test-key:fx')
    await adapter.translate('Hello', 'en-US', 'fr')

    const mockClient = vi.mocked(deepl.DeepLClient).mock.results[0].value as {
      translateText: ReturnType<typeof vi.fn>
    }
    // Source must be 'EN' not 'EN-US' — DeepL rejects regional variants as source
    expect(mockClient.translateText).toHaveBeenCalledWith('Hello', 'EN', 'FR')
  })

  it('preserves regional subtag in target lang (e.g. en-US → EN-US)', async () => {
    const adapter = new DeepLAdapter('test-key:fx')
    await adapter.translate('Bonjour', 'fr', 'en-US')

    const mockClient = vi.mocked(deepl.DeepLClient).mock.results[0].value as {
      translateText: ReturnType<typeof vi.fn>
    }
    // Target must keep regional variant — EN-US is a valid DeepL target
    expect(mockClient.translateText).toHaveBeenCalledWith('Bonjour', 'FR', 'EN-US')
  })

  it('returns the translated text string', async () => {
    const adapter = new DeepLAdapter('test-key')
    const result = await adapter.translate('Good morning', 'en', 'de')
    expect(typeof result).toBe('string')
    expect(result).toBe('Bonjour')
  })
})

describe('DeepLAdapter.translateBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns [] without calling the API for an empty input', async () => {
    const adapter = new DeepLAdapter('test-key:fx')
    const result = await adapter.translateBatch([], 'en', 'fr')

    const mockClient = vi.mocked(deepl.DeepLClient).mock.results[0].value as {
      translateText: ReturnType<typeof vi.fn>
    }
    expect(result).toEqual([])
    expect(mockClient.translateText).not.toHaveBeenCalled()
  })

  it('sends the whole array in a single call and preserves order', async () => {
    vi.mocked(deepl.DeepLClient).mockImplementationOnce(
      () =>
        ({
          translateText: vi
            .fn()
            .mockResolvedValue([{ text: 'un' }, { text: 'deux' }, { text: 'trois' }]),
        }) as never,
    )
    const adapter = new DeepLAdapter('test-key:fx')
    const result = await adapter.translateBatch(['one', 'two', 'three'], 'en-US', 'fr')

    const mockClient = vi.mocked(deepl.DeepLClient).mock.results[0].value as {
      translateText: ReturnType<typeof vi.fn>
    }
    expect(mockClient.translateText).toHaveBeenCalledTimes(1)
    expect(mockClient.translateText).toHaveBeenCalledWith(['one', 'two', 'three'], 'EN', 'FR')
    expect(result).toEqual(['un', 'deux', 'trois'])
  })

  it('chunks inputs larger than 50 into multiple calls, in order', async () => {
    const translateText = vi
      .fn()
      .mockImplementation((texts: string[]) => Promise.resolve(texts.map((t) => ({ text: `t:${t}` }))))
    vi.mocked(deepl.DeepLClient).mockImplementationOnce(() => ({ translateText }) as never)

    const adapter = new DeepLAdapter('test-key:fx')
    const inputs = Array.from({ length: 120 }, (_, i) => `s${i}`)
    const result = await adapter.translateBatch(inputs, 'en', 'fr')

    // 120 items → 50 + 50 + 20 = 3 calls
    expect(translateText).toHaveBeenCalledTimes(3)
    expect(translateText.mock.calls[0][0]).toHaveLength(50)
    expect(translateText.mock.calls[1][0]).toHaveLength(50)
    expect(translateText.mock.calls[2][0]).toHaveLength(20)
    expect(result).toHaveLength(120)
    expect(result[0]).toBe('t:s0')
    expect(result[119]).toBe('t:s119')
  })
})

describe('createDeepLAdapter', () => {
  it('returns a TranslationAdapter-compatible object', async () => {
    const adapter = createDeepLAdapter('test-key')
    expect(typeof adapter.translate).toBe('function')
    expect(typeof adapter.translateBatch).toBe('function')
  })
})
