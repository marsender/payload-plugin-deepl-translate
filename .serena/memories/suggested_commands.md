# Suggested Commands

## Development
```bash
pnpm test          # Run unit tests (Vitest) — ALWAYS use this, not `vitest` directly
pnpm lint          # ESLint on src/
pnpm lint:fix      # ESLint with auto-fix
pnpm type-check    # TypeScript type check (no emit)
pnpm build         # Full build: copyfiles + tsc declarations + swc transpile
pnpm clean         # Remove dist/ and *.tsbuildinfo
```

## Pre-Commit Checklist (in order)
```bash
pnpm type-check && pnpm lint && pnpm test && pnpm build
```

## Git / Utilities
```bash
git status
git log --oneline -10
pnpm install       # Install dependencies
```

## Notes
- Package manager: pnpm (v9 or v10)
- Build output: dist/
- Test runner: vitest (via `pnpm test` only)
