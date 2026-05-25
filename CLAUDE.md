# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EduHub is an Indonesian CPNS (civil service exam) preparation platform. Next.js 16 App Router frontend with Convex serverless backend, Clerk authentication, and Midtrans payments.

## Critical Warnings

- **Next.js 16 breaking changes**: APIs and conventions differ from training data. Read `node_modules/next/dist/docs/` before writing Next.js code. See `AGENTS.md`.
- **Convex guidelines**: Always read `convex/_generated/ai/guidelines.md` before writing any Convex code. Those rules override training data.

## Commands

```bash
npm run dev              # Start Next.js dev server (port 3000)
npx convex dev           # Start Convex dev server (run alongside next dev)
npm run build            # Production build
npm run lint             # ESLint 9
npm run test             # Vitest (single run)
npm run test:watch       # Vitest watch mode
npm run test:coverage    # Vitest with coverage
vitest run __tests__/path/to/file.test.ts  # Run single test file
```

Both `npm run dev` and `npx convex dev` must run simultaneously for local development.

## Architecture

### Tech Stack
- **Frontend**: Next.js 16.2.3, React 19, TailwindCSS v4 (OKLCH colors), shadcn UI (base-nova style)
- **Backend**: Convex (serverless, real-time queries/mutations)
- **Auth**: Clerk (`@clerk/nextjs` v7) with JWT sync to Convex
- **Payments**: Midtrans (Snap token flow)
- **Testing**: Vitest 4 (node environment)

### App Router Layout Groups

```
app/
  (marketing)/   # Public landing page (/)
  (auth)/        # Sign-in/sign-up pages (Clerk UI)
  (dashboard)/   # Protected user area — has Sidebar, Navbar, BottomNav
  (admin)/       # Admin area — server-side role guard
  api/webhook/clerk/route.ts  # Clerk webhook for user sync to Convex
```

Groups `(name)` affect layout nesting, not URL paths.

### Auth Flow
1. `proxy.ts` — Clerk middleware. Public routes: `/`, `/sign-in`, `/sign-up`, `/api/webhook`. Everything else requires auth.
2. Clerk webhook at `/api/webhook/clerk` syncs user.created/updated/deleted events to Convex (verified via Svix).
3. Convex auth uses Clerk JWT — configured in `convex/auth.config.ts`.
4. Users table tracks `role` (user/admin) and `tier` (free/trial/pro).

**Note**: Middleware file is `proxy.ts`, not `middleware.ts`.

### Convex Backend
- Schema in `convex/schema.ts` — tables: users, categories, modules, quizzes, questions, attempts, videoProgress, transactions
- Functions in `convex/*.ts` (queries, mutations, actions)
- Auto-generated types in `convex/_generated/`
- Queries are real-time subscribed via `useQuery()` hook

### Key Patterns
- `ConvexProviderWithClerk` wraps the app (see `components/providers/`)
- `cn()` utility in `lib/utils.ts` (clsx + tailwind-merge)
- Path alias: `@/*` maps to project root
- Quiz types: `latihan` (practice) and `ujian` (exam)
- Soft delete on users (`isDeleted` flag)

### Environment Variables
See `.env.local.example`. Required: Clerk keys, Convex URL, Clerk JWT issuer domain, Midtrans keys, webhook secret.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (90-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk vitest run          # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%)
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->