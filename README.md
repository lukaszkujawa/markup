# Markup

A desktop markdown editor with real-time preview, built with Tauri, TypeScript, and CodeMirror 6.

## Features

- Real-time markdown preview with synchronized scrolling
- Syntax highlighting for code blocks
- D2 diagram rendering
- SVG diagram support with interactive fullscreen viewer (pan & zoom)
- File and folder management
- Custom editor formatting shortcuts
- Adjustable font size (Cmd+/Cmd-)

## Prerequisites

- Node.js (v16 or higher)
- Rust (for Tauri)
- npm or yarn

## Installation

Install dependencies:

```bash
npm install
```

## Development

Run the app in development mode:

```bash
npm run tauri dev
```

This will start the Vite dev server and launch the Tauri application.

## Building

### Build .app Bundle

Build the application for production:

```bash
npm run tauri build
```

The `.app` bundle will be available at `src-tauri/target/release/bundle/macos/Markup.app`.

### Create DMG Installer

To create a DMG installer with drag-to-Applications functionality:

```bash
./create-dmg.sh
```

This will build the app and create `Markup_0.1.0_aarch64.dmg` in the project root.

## Project Structure

- `src/` - Frontend TypeScript source code
  - `features/` - Feature modules (editor, preview, navigation)
  - `core/` - Core state management and utilities
- `src-tauri/` - Rust backend (Tauri)
- `index.html` - Main HTML entry point

## Tech Stack

- Tauri v2
- TypeScript
- CodeMirror 6
- Marked (markdown parser)
- D2 (diagram rendering)
- Vite (build tool)
