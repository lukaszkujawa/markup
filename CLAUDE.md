# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Markup is a Tauri-based desktop markdown editor with real-time preview, built using TypeScript, CodeMirror 6, and Marked. It features syntax highlighting for code blocks, D2 diagram rendering, and synchronized scrolling between editor and preview.

## Development Commands

NEVER add comments to the code.

### Frontend (Vite)
- `npm run dev` - Start Vite dev server on port 1420
- `npm run build` - Type check with tsc and build for production
- `npm run preview` - Preview production build

### Tauri Application
- `npm run tauri dev` - Run the Tauri app in development mode
- `npm run tauri build` - Build the Tauri app for production

## Architecture

### Core State Management (`src/core/`)

The application uses a centralized state management system with two main domains:

1. **AppState** (`state.ts`): Manages notes and editor state
   - Stores notes as a Record<string, Note> where each note has id, title, content, timestamps
   - Tracks currentNoteId for the active note
   - Persists to localStorage under key `markup_app_state`
   - Provides pub/sub via `subscribe()` for state change listeners
   - Migration logic handles old format with `editorContent` to new notes-based format

2. **FileSystem** (`files.ts`): Manages hierarchical file/folder structure
   - Separate storage from notes - files can be imported/exported independently
   - Uses `FileNode` and `FolderNode` with parent-child relationships
   - Persists to localStorage under key `markup_filesystem`
   - Supports import/export to JSON, folder positioning, and recursive folder deletion

**Important**: State mutations must go through `setState()` which validates, persists, and notifies subscribers. Direct mutations to the state object will work in memory but won't persist or trigger updates.

### Plugin Architecture

The preview system uses a plugin-based rendering approach:

1. Plugins register custom renderers via `registerCodeBlockRenderer(language, renderer)`
2. The marked renderer delegates code blocks to registered handlers
3. Currently implemented plugins:
   - **code.ts**: Syntax highlighting for JavaScript/TypeScript using highlight.js
   - **d2.ts**: Asynchronous D2 diagram rendering with caching and debouncing

**D2 Plugin Implementation Notes**:
- Renders are debounced (300ms) and cached (max 50 entries) using code hashes
- Async rendering: placeholder HTML with ID is returned immediately, actual SVG injected after compilation
- SVG dimensions are stripped and replaced with 100% width for responsive behavior
- Cleanup functions (`destroyD2Plugin`) must be called to prevent memory leaks

### Editor-Preview Sync

Scroll synchronization works via:
1. Editor scroll handler calculates `editorScrollPercent` (0-1) and updates state
2. Preview subscribes to state changes and sets its scroll position proportionally
3. This creates synchronized scrolling without tight coupling

### Application Lifecycle

Initialization order (see `src/main.ts`):
1. Render static layout HTML
2. Initialize plugins (code, d2)
3. Initialize CodeMirror editor
4. Initialize marked-based preview
5. Setup event listeners and subscriptions

Cleanup on `beforeunload` destroys editor, preview, and plugins to prevent memory leaks.

## Key Technical Details

### CodeMirror Editor
- Uses markdown language support with code language detection via `@codemirror/language-data`
- Custom `CodeBlockPlugin` handles code block decorations
- Update listener syncs content changes to state via `updateNoteContent()`
- Editor state is loaded from `getCurrentNoteContent()` on init

### TypeScript Configuration
- Target ES2020 with strict mode enabled
- Bundler module resolution (Vite)
- No emit (bundler handles output)
- Unused locals/parameters checked

### Tauri Integration
- Minimal Rust backend with single `greet` command (example)
- Frontend communicates with Tauri via `@tauri-apps/api`
- Development server runs on port 1420, HMR on 1421
