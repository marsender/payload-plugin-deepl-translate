import type { PluginLanguage } from '../types.js'

export const fr: PluginLanguage = {
  dateFNSKey: 'fr',
  translations: {
    'plugin-deepl-translate': {
      cancelButton: 'Annuler',
      errorDocumentNotFound: 'Document introuvable',
      errorNoAdapter: 'Adaptateur de traduction non configuré',
      errorSameLocale: 'La locale source et la locale cible doivent être différentes',
      noFieldsFound: 'Aucun champ traduisible trouvé',
      saveFirstTooltip: 'Enregistrez le document avant de traduire',
      selectLocalesPlaceholder: 'Sélectionner les locales cibles...',
      successMessage: '{{fields}} champ(s) traduit(s) vers {{locales}} locale(s)',
      translateButton: 'Traduire',
      translateModalDescription: 'Traduire le contenu de {{sourceLocale}} vers\u00a0:',
      translateModalTitle: 'Traduire le document',
      translating: 'Traduction en cours...',
    },
  },
}
