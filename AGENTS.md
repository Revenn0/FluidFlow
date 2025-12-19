# Agent Guidelines for FluidFlow

## Development Commands
```bash
npm run dev              # Start both frontend (3100) + backend (3200)
npm run type-check       # TypeScript checking (tsc --noEmit)
npm run lint             # ESLint with zero warnings tolerance
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Prettier formatting
npm test                 # Vitest watch mode
npm test -- path/to/test.ts  # Run specific test file
npm run test:security    # Security tests only
```

## Code Style Guidelines

### Imports & Formatting
- Use `@/*` path alias for all imports
- Single quotes, trailing commas, 2-space indentation
- React imports first, then external libs, then internal modules
- Order: React → External → Internal (grouped by directory)

### TypeScript
- Strict mode enabled, prefer explicit typing
- Use `interface` for object shapes, `type` for unions/primitives
- Prefix unused params with `_` to bypass ESLint
- Avoid `any` except in test files

### Naming & Patterns
- Components: PascalCase (e.g., `ControlPanel`)
- Files: kebab-case for folders, PascalCase for React files
- Hooks: `useXxx` prefix, always custom hooks in `/hooks`
- Constants: UPPER_SNAKE_CASE in `/constants`

### Error Handling
- Validate inputs with `utils/validation.ts`
- Use try-catch for async operations
- Log with `debugLog()` from `useDebugStore`
- Security: sanitize file paths, prevent XSS via DOMPurify

### Architecture Notes
- State via `contexts/AppContext.tsx` - avoid local state
- AI calls through `services/ai/index.ts` ProviderManager
- Virtual filesystem in `projects/[id]/files/`
- Tests: Vitest with jsdom, security tests in `/tests/security`