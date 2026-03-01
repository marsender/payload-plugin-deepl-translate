<!--
=== SYNC IMPACT REPORT ===
Version Change: 1.0.0 → 1.0.2

Modified Principles:
- IV. Test-Driven Quality: corrected test file suffix from `.spec.ts` to `.test.ts`
  to match the actual convention used throughout the test suite.
- IV. Test-Driven Quality: formalised two-folder test structure —
  `tests/unit/` for isolated unit tests, `tests/int/` for integration tests.

Added Sections: None

Removed Sections: None

Templates Requiring Updates:
- .specify/templates/plan-template.md ✅ No changes needed (Constitution Check gate is dynamic)
- .specify/templates/spec-template.md ✅ No changes needed
- .specify/templates/tasks-template.md ✅ No changes needed
- README.md ✅ No changes needed

Deferred TODOs: None

Version Bump Rationale:
- 1.0.0 → 1.0.1 PATCH: corrected `.spec.ts` → `.test.ts` suffix and adapter test path.
- 1.0.1 → 1.0.2 PATCH: formalised `tests/unit/` and `tests/int/` folder structure.
========================
-->

# payload-plugin-deepl-translate Constitution

## Core Principles

### I. Type Safety First

All code MUST be written in TypeScript with strict mode enabled. This principle ensures
reliability, maintainability, and self-documenting code across the entire plugin codebase.

**Non-negotiable rules:**

- Full TypeScript strict mode (`strict: true` in tsconfig)
- Exported types MUST be accurate and complete — consumers rely on them
- No `any` types unless absolutely necessary and justified in code review
- Run `pnpm type-check` before all commits
- Public API surface (all exports) MUST have explicit return types

**Rationale:** Plugin consumers depend on correct type contracts. Broken types in a published
package cascade into all downstream projects and are expensive to fix.

### II. Adapter-First Design

All translation backends MUST implement the `TranslationAdapter` interface. The plugin MUST
never hardcode a specific translation provider.

**Non-negotiable rules:**

- Every translation provider MUST implement `TranslationAdapter` from `src/adapters/types.ts`
- Adapters MUST expose a single `translate(text, source, target)` method — no extra surface
- Locale code normalisation is the adapter's responsibility (e.g. uppercasing for DeepL)
- The adapter instance MUST be stored in `payload.config.custom.translateAdapter` at init time
- The endpoint handler MUST retrieve the adapter from `payload.config.custom` — no direct imports
- Adding a new provider means adding a new adapter file only — the core plugin MUST NOT change

**Rationale:** Adapter isolation keeps the plugin provider-agnostic. Users can swap DeepL for
any custom translation service without touching plugin internals.

### III. Plugin Isolation

The plugin MUST be a clean, self-contained package that does not pollute the host Payload
application's configuration, globals, or client bundle.

**Non-negotiable rules:**

- Client components MUST use the `'use client'` directive and be exported via the `./client` entrypoint
- Translations MUST be namespaced under `plugin-deepl-translate` and exported via `./translations`
- The plugin MUST NOT modify existing collections or global configs — only register new endpoints and UI elements
- All runtime dependencies (e.g. `sonner`, `deepl-node`) MUST be listed in `dependencies`, not `devDependencies`
- Peer dependencies (`payload`, `react`) MUST be listed in `peerDependencies` with compatible version ranges
- The plugin factory function MUST be side-effect free until `init()` is called by Payload

**Rationale:** A plugin that leaks into the host app breaks upgrades and makes debugging
unpredictable. Clean package boundaries protect plugin consumers.

### IV. Test-Driven Quality

All features MUST be validated through unit tests. Tests MUST cover the public API surface
and all adapter implementations.

**Non-negotiable rules:**

- ALWAYS use `pnpm test` to run the test suite (Vitest)
- NEVER use `vitest` or `npx vitest` directly
- Run `pnpm type-check && pnpm lint` before committing
- Test files MUST use `.test.ts` suffix
- Unit tests MUST live in `tests/unit/` — isolated, no external I/O, mocked SDKs
- Integration tests MUST live in `tests/int/` — may require a running Payload instance
- Tests MUST be independent and not rely on execution order
- Adapter unit tests MUST mock the external provider SDK — no live API calls
- Field utility functions (`extractTranslatableFields`, `applyTranslations`) MUST have full coverage

**Rationale:** Unit tests validate plugin logic in isolation without requiring a running Payload
instance. Mocking external SDKs keeps the test suite fast and deterministic. Integration tests
in a separate folder can be run selectively and excluded from the default CI gate.

### V. Simplicity & YAGNI

Solutions MUST be the minimum complexity required to solve the current problem.
Over-engineering is a violation of this principle.

**Non-negotiable rules:**

- Only make changes that are directly requested or clearly necessary
- DO NOT add features, refactor code, or make "improvements" beyond what was asked
- A bug fix does NOT need surrounding code cleaned up
- A simple feature does NOT need extra configurability
- DO NOT add docstrings, comments, or type annotations to code you didn't change
- Three similar lines of code is better than a premature abstraction
- DO NOT design for hypothetical future requirements
- DO NOT create helpers, utilities, or abstractions for one-time operations

**Rationale:** Complexity has compounding costs — maintenance burden, cognitive load, and
bug surface area. Simple plugin code is easier to understand, test, and integrate.

## Technology Stack

The following technologies are mandated for this plugin. Deviations require governance approval.

| Category     | Technology                               | Version       |
| ------------ | ---------------------------------------- | ------------- |
| Language     | TypeScript                               | 5.x           |
| Runtime      | Node.js                                  | ≥ 18.20       |
| CMS (peer)   | Payload CMS                              | ^3.0.0        |
| UI (peer)    | React                                    | ^19.0.0       |
| UI Helpers   | @payloadcms/ui                           | ^3.0.0        |
| i18n         | @payloadcms/translations                 | ^3.0.0        |
| Translation  | deepl-node                               | ^1.x          |
| Toasts       | sonner                                   | runtime dep   |
| Testing      | Vitest                                   | -             |
| Build        | swc + tsc (declaration only) + copyfiles | -             |

### Package Exports

| Export            | Purpose                                   |
| ----------------- | ----------------------------------------- |
| `.`               | Plugin factory (`deeplTranslatePlugin`)   |
| `./client`        | React client components (TranslateButton) |
| `./translations`  | i18n messages (en, fr)                    |
| `./types`         | Exported TypeScript types                 |

**Supported locales:** English (`en`), French (`fr`)

## Development Workflow

### Pre-Commit Checklist

1. Run `pnpm type-check` — TypeScript MUST pass
2. Run `pnpm lint` — ESLint MUST pass (use `pnpm lint:fix` if needed)
3. Run `pnpm test` — All unit tests MUST pass
4. Run `pnpm build` — Build MUST succeed before publishing

### Build Pipeline

```bash
pnpm build
# 1. copyfiles — copy non-TS assets (translations JSON, etc.) to dist/
# 2. tsc --emitDeclarationOnly — generate .d.ts files
# 3. swc — transpile TypeScript to JavaScript
```

### Adding a New Translation Adapter

1. Create `src/adapters/<provider>.ts` implementing `TranslationAdapter`
2. Handle locale code normalisation inside the adapter
3. Export the factory function from `src/adapters/<provider>.ts`
4. Add unit tests in `tests/unit/<provider>.test.ts` with mocked SDK
5. Document usage in README

### Adding New UI Text

1. Add keys to `src/translations/languages/en.ts` and `src/translations/languages/fr.ts`
2. Use the `plugin-deepl-translate` i18n namespace
3. Cast `t` as `(key: string) => string` when using `useTranslation` from `@payloadcms/ui`

### Code Review Requirements

- All PRs MUST verify compliance with this constitution
- Public API changes MUST be reflected in exported types
- New adapters MUST include unit tests before merge

## Governance

This constitution supersedes all other development practices for the payload-plugin-deepl-translate
project. Amendments require documentation and a migration plan where applicable.

**Amendment Procedure:**

1. Propose change with rationale in writing
2. Review impact on existing code and templates
3. Update constitution version following semantic versioning
4. Update dependent templates if principles change
5. Communicate changes to all contributors

**Versioning Policy:**

- MAJOR: Backward incompatible governance changes or principle removals
- MINOR: New principle added or existing principle materially expanded
- PATCH: Clarifications, wording fixes, non-semantic refinements

**Compliance Review:**

- All code reviews MUST verify constitution compliance
- Use `.specify/memory/constitution.md` as single source of truth

**Version**: 1.0.2 | **Ratified**: 2026-03-01 | **Last Amended**: 2026-03-01
