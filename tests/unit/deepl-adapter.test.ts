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

describe('createDeepLAdapter', () => {
  it('returns a TranslationAdapter-compatible object', async () => {
    const adapter = createDeepLAdapter('test-key')
    expect(typeof adapter.translate).toBe('function')
  })
})
