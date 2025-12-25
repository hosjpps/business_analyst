# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planned
- Deploy to Vercel
- Test with real repositories
- Fine-tune prompts based on testing

---

## [0.2.0] - 2024-12-26

### Added

**ZIP Archive Support:**
- JSZip integration for browser-side extraction
- Automatic file filtering during extraction
- Support for nested directories in archives
- File size limits: 500KB per file, 2MB per archive
- Binary file detection and filtering

**Chat History:**
- Full conversation history preserved
- Copy-to-clipboard button for each answer
- Fallback for older browsers (execCommand)

**Color Legend:**
- Priority/severity indicators (high/medium/low)
- Category badges (documentation, technical, product, marketing, business)
- Visual legend in results section

**UI Improvements:**
- Complete redesign with GitHub Dark theme
- CSS variables for consistent theming
- Custom scrollbar styling
- Improved form inputs with focus states
- Better responsive layout

### Changed
- File size limits increased (50KB → 500KB)
- Max files per upload increased (100 files)
- Chat state changed from single response to history array
- Improved file list display with "clear all" button

### Technical
- Added `jszip` dependency
- CSS refactored to use CSS variables
- Added ignore patterns for common build artifacts

---

## [0.1.0] - 2024-12-26

### Added

**Core Infrastructure:**
- Next.js 14 project with App Router
- TypeScript configuration (ES2017 target)
- Package dependencies (next, react, octokit, openai, zod)

**GitHub Integration:**
- `src/lib/github/fetcher.ts` — GitHub API client
- Repository URL parsing (supports various formats)
- Smart file filtering (priority files, ignore patterns)
- File content fetching with size limits (50KB)

**LLM Integration:**
- `src/lib/llm/client.ts` — OpenRouter client (OpenAI SDK compatible)
- Lazy initialization (avoids build-time errors)
- `src/lib/llm/prompts.ts` — Analysis and chat prompts
- JSON response parsing with markdown cleanup

**Analyzers:**
- `src/lib/analyzers/structure.ts` — Project structure analysis
- Tech stack detection (React, Vue, Python, Go, etc.)
- Project stage detection (documentation/mvp/launched/growing)
- Line counting

**API Routes:**
- `POST /api/analyze` — Main analysis endpoint
  - Accepts files array OR GitHub URL
  - Project description required
  - Optional user context (week, previous tasks, goal)
  - Returns analysis with tasks, issues, strengths
- `POST /api/chat` — Follow-up questions endpoint
  - Contextual responses based on previous analysis

**Frontend:**
- `src/app/page.tsx` — Main page with full UI
- GitHub URL input
- File upload (drag & drop)
- Project description textarea
- Results display (stages, issues, tasks)
- Chat interface for follow-up questions
- Responsive CSS styling

**Documentation:**
- `docs/architecture.md` — System architecture
- `docs/changelog.md` — This file
- `docs/project-status.md` — Progress tracking
- `.env.example` — Environment variables template

**Types:**
- `src/types/index.ts` — Full TypeScript interfaces
- API request/response types
- Analysis types (Stage, Priority, Category, etc.)

### Technical Decisions
- Next.js API Routes instead of Express (native Vercel support)
- OpenRouter for LLM access (Claude Opus 4.5 / Sonnet 4)
- Lazy client initialization (build without API key)
- Zod for request validation

---

## [0.0.1] - 2024-12-26

### Added
- Initial project planning
- Created Claude.md (task specification)
- Defined project requirements
