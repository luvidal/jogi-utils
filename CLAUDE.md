# @jogi/utils — Server Utilities

Server-side utilities for Next.js API routes: rate limiting, SSE (Server-Sent Events), JWT auth, and API handler wrappers.
Extracted from [jogi](../jogi) to be shared across Next.js projects.

## Compact Instructions

When compacting, preserve: file paths changed, errors found, decisions made, interface changes. Drop: full file contents already read, tool output bodies.

## Communication Style

- **No emotional validation** — never say "I understand your frustration". Results matter, not words.
- **No excessive apologies** — don't apologize repeatedly. Fix the problem.
- **Be direct** — state facts, propose solutions, execute. Skip the fluff.
- **Ask for input** — when stuck or facing multiple approaches, ask rather than guessing.

## Tech Stack

- **Runtime**: Node.js + Next.js (peer dep ≥14)
- **Build**: tsup (ESM + CJS + types)
- **Tests**: vitest
- **Auth**: jose (JWT)

## Project Structure

```
src/
├── index.ts          # Re-exports all utilities
├── ratelimit.ts      # In-memory rate limiter (rateLimit, checkRateLimit, getClientIp)
├── sse.ts            # SSEEmitter — manages SSE connections per user
├── jwt.ts            # createJwtAuth — JWT cookie auth factory
└── apihandler.ts     # createApiHandler — Next.js API route wrapper
```

## Code Rules

1. **File naming** → lowercase, no hyphens/underscores
2. **No `@/` imports** → all imports are relative within `src/`
3. **Five entry points** (each tree-shakeable):
   - `@jogi/utils` — all utilities
   - `@jogi/utils/ratelimit`, `/sse`, `/jwt`, `/apihandler` — individual
4. **No domain logic** — utilities must be generic. No jogi-specific business rules.
5. **API stability** — exported interfaces must stay backward-compatible with jogi. Breaking changes require updating jogi's API routes
6. **Error handling** — use the `onError` callbacks/options pattern, never throw unhandled
7. **Test coverage** — after implementing a feature, check if tests exist. Update or write tests. Never leave a feature without test coverage.
8. **Planning** — for non-trivial changes, write a plan to `docs/plans/` before implementing

## Commands

```bash
npm run build        # Build dist/ (ESM + CJS + types)
npm run dev          # Build in watch mode
npm test             # Run unit tests
npm run test:watch   # Watch mode
```

## Validation

Use `npx tsc --noEmit` for fast type checking. Run `npm run build` to verify bundling. Run `npm test` before committing.

## Consumer Integration

Consumed by jogi via GitHub reference:
```json
"@jogi/utils": "github:luvidal/jogi-utils#main"
```

Primary consumer: `~/GitHub/jogi` — see its `pages/api/` for usage context.
