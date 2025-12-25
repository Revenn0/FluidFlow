# Changelog

All notable changes to FluidFlow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2025-12-25

### Added
- Smart File Context tracking system with delta mode for token optimization
- Prompt Confirmation modal for reviewing AI requests before sending
- File context info display in prompts (files in prompt, tokens saved)
- Token savings indicator in StatusBar showing context optimization
- Settings panel for Smart File Context with reset functionality
- CodebaseSync integration with file context tracker
- Version checking and changelog display system
- About panel in settings with app info and update notifications

### Changed
- Context compaction now uses remaining-space-based threshold instead of usage-based
- Improved StatusBar with real-time status tracking via StatusBarContext
- Enhanced IDEFrame with activity bar, title bar integration

### Fixed
- ActivityBar tooltip positioning and styling
- Auto-commit status display in StatusBar

## [0.4.0] - 2025-12-24

### Added
- GitHub clone-by-URL import mode for projects
- Backup settings moved to dedicated panel
- Conversation history sync option for GitHub push
- `.fluidflow/` metadata directory for project settings

### Changed
- Reorganized GitHub settings panel layout
- Improved project import/export workflow

## [0.3.0] - 2025-12-23

### Added
- Multi-provider AI support (Gemini, OpenAI, Anthropic, OpenRouter, Ollama, LM Studio)
- Live preview with device simulation (desktop, tablet, mobile)
- Git integration with commit history and diff viewer
- WIP (Work In Progress) persistence via IndexedDB
- Monaco Editor integration with syntax highlighting
- Console and network log panels

### Changed
- Switched to Express 5 for backend API
- Improved streaming response handling

### Fixed
- CORS issues with local AI providers
- WebContainer API HTTPS requirement handling

## [0.2.0] - 2025-12-20

### Added
- Sketch-to-code conversion using AI
- Basic project management (create, load, save)
- File tree with create/rename/delete operations
- Tailwind CSS support in generated code

### Changed
- Migrated from Create React App to Vite
- Updated to React 19

## [0.1.0] - 2025-12-15

### Added
- Initial project setup
- Basic React application structure
- Vite build configuration
- TypeScript configuration
- ESLint and Prettier setup
