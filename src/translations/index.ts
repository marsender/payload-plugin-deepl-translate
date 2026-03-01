import type { SupportedLanguages } from '@payloadcms/translations'

import type { PluginDefaultTranslationsObject } from './types.js'

import { en } from './languages/en.js'
import { fr } from './languages/fr.js'

export { en, fr }

export const translations = {
  en,
  fr,
} as SupportedLanguages<PluginDefaultTranslationsObject>
