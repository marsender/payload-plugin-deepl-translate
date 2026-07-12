import path from 'path'
import { fileURLToPath } from 'url'
import tseslint from 'typescript-eslint'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Payload local-API calls that run inside a request MUST share its DB transaction by passing
 * `req`. Without it the call takes a fresh pooled connection in its own transaction: it cannot
 * see the in-flight writes of the enclosing chain (FK violations, stale reads), it commits or
 * rolls back independently of the request, and it blocks forever on any row the request
 * transaction already locked.
 *
 * A deliberate omission uses a conditional spread, which this rule intentionally does not flag —
 * the spread is the marker that the author thought about it.
 */
const payloadMethods =
  '/^(create|update|updateOne|updateByID|delete|deleteOne|find|findOne|findByID|upsert|count)$/'
const missingReqObject =
  'ObjectExpression:first-child:not(:has(Property[key.name="req"])):not(:has(SpreadElement))'
const missingReqMessage =
  'Payload call is missing `req`. Without it the call runs on a separate pooled connection in its own transaction — it cannot see in-flight writes (FK violations, stale reads), commits independently of the request, and can deadlock against rows the request transaction already locked. Add `req` to the call object.'

const missingReqSelectors = [
  // `payload.create(...)`, `db.updateOne(...)`
  {
    selector: `CallExpression[callee.property.name=${payloadMethods}][callee.object.name=/^(payload|db)$/] > ${missingReqObject}`,
    message: missingReqMessage,
  },
  // `req.payload.create(...)`, `payload.db.updateOne(...)`
  {
    selector: `CallExpression[callee.property.name=${payloadMethods}][callee.object.property.name=/^(payload|db)$/] > ${missingReqObject}`,
    message: missingReqMessage,
  },
]

export default [
  // Global ignores
  {
    ignores: ['node_modules/**', 'dist/**', '*.tsbuildinfo'],
  },

  // TypeScript ESLint
  ...tseslint.configs.recommended,

  // Parser options with explicit tsconfigRootDir
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },

  // Transaction safety: every Payload call must thread `req`.
  {
    rules: {
      'no-restricted-syntax': ['error', ...missingReqSelectors],
    },
  },

  // Custom rules
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
]
