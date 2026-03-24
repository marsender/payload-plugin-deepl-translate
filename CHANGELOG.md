# Changelog

All notable changes to `@marsender/payload-plugin-deepl-translate` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [3.80.0] - 2026-03-20

### Added
- `onAfterTranslate` hook — callback invoked after a successful translation, enabling custom post-processing
- `translatedCharacters` count in the translation API response
- `payload` instance passed to `tenantFilter` for richer filtering logic
- Retry logic with sleep between calls for more resilient DeepL API communication
- Logging in the translate handler for easier debugging

### Changed
- Replaced client-side `translate-check` API call with a server component wrapper (`TranslateButtonWrapper`) for better performance and reliability
- Moved `TranslateButtonWrapper` to the client export to prevent CSS import issues during Payload CLI operations
- Reduced translate dialog button height (medium → small)
- Removed console error when DeepL API key is not set

### Fixed
- Button visibility: `translate-check` endpoint is now always called to correctly determine visibility
- SEO tab fields not being translated (#11)
- Translation not applied inside blocks (#10)
- Target locale not set in Payload request (#9)

## [3.79.1] - 2026-03-11

### Changed
- CI/CD: switched to pure OIDC trusted publishing for npm releases (removed `NPM_TOKEN`)
- CI/CD: removed npm publish step, kept GitHub Release only
- Updated Serena project configuration

## [3.79.0] - 2026-03-07

### Added
- Tenant filtering support: restrict translations to specific tenants (#12)
- GitHub Actions release workflow with npm publish support
- Development and release workflow documentation in README

### Changed
- Upgraded to Payload 3.79.0
- Upgraded build tooling and dependencies

### Fixed
- `id` fields stripped at all nesting levels before `payload.update()` to avoid write conflicts (#9)
- Target locale not propagated correctly in Payload request (#9)
- Locale mapping support for Payload ↔ DeepL locale code differences (#8)

## [Pre-release] - Initial development

### Added
- Initial plugin implementation: `deeplTranslatePlugin(config)` factory
- `TranslationAdapter` interface with pluggable `translate(text, source, target)` method
- Built-in DeepL adapter wrapping `deepl-node` SDK (automatic UPPERCASE locale conversion)
- `POST /api/translate` endpoint handler
- `TranslateButton` React component with multi-locale selection (all non-current locales pre-selected by default)
- `extractTranslatableFields` and `applyTranslations` field utilities
- i18n support (English + French) under namespace `plugin-deepl-translate`
- `deeplApiKey` can be `string | undefined` (plugin loads without a key configured)
- `sonner` toast notifications in the translate dialog (sourced from Payload's own bundle)
- Integration tests (vitest)
- Husky pre-commit hooks (lint + build)
- Support for installation as a git dependency (graceful Husky fallback)
