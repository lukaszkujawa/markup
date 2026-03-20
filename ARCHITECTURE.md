# Markup Application Architecture

## System Architecture Diagram

```d2
direction: right

title: {
  label: Markup Application Architecture
  near: top-center
  shape: text
  style.font-size: 24
  style.bold: true
}

# Core Layer
core: Core Layer {
  shape: rectangle
  style.fill: "#e8f4f8"

  state: State Management {
    shape: cylinder
    style.fill: "#d4e8ff"

    appState: "AppState\n• notes\n• folders\n• currentNotePath\n• editor/preview state"
    pubsub: "Pub/Sub System\n• subscribe()\n• listeners[]"
    mutations: "State Mutations\n• createNote()\n• deleteNote()\n• updateNoteContent()\n• createFolder()\n• renameFolder()"

    appState -> pubsub: notifies
    mutations -> appState: updates
  }

  fs: File System Layer {
    shape: rectangle
    style.fill: "#ffe8d4"

    tauri: "Tauri Commands\n• list_notes\n• read_note\n• write_note\n• create_folder\n• move_note"
    storage: "Persistence\n• .md files\n• .markup/metadata.json"

    tauri -> storage: persists
  }

  state.mutations -> fs.tauri: calls
}

# Feature Layer
features: Feature Modules {
  shape: rectangle
  style.fill: "#f0f0f0"

  editor: Editor {
    shape: rectangle
    style.fill: "#d4ffe8"

    codemirror: "CodeMirror 6\n• markdown syntax\n• line numbers\n• code folding"
    codeblock: "CodeBlock Plugin\n• syntax decorations"
    formatting: "Formatting\n• bold, italic, etc."

    codemirror -> codeblock: uses
    formatting -> codemirror: modifies
  }

  preview: Preview {
    shape: rectangle
    style.fill: "#ffd4e8"

    marked: "Marked.js\n• markdown → HTML"
    pluginRegistry: "Plugin Registry\n• Map<lang, renderer>"
    checkbox: "Checkbox Handler\n• sync [ ] ↔ [x]"

    marked -> pluginRegistry: delegates
    checkbox -> marked: updates
  }

  nav: Navigation {
    shape: rectangle
    style.fill: "#ffe8ff"

    topnav: "TopNav\n• toolbar\n• formatting buttons"
    filenav: "FileNav\n• tree rendering\n• drag & drop"
    search: "SearchPanel\n• query + results"
    footer: "Footer\n• line/column"

    topnav -> filenav: toggles
    topnav -> search: toggles
  }
}

# Plugin System
plugins: Preview Plugins {
  shape: rectangle
  style.fill: "#fff4d4"

  code: "Code Plugin\n• highlight.js\n• JS/TS syntax"
  d2: "D2 Plugin\n• diagram rendering\n• caching + debounce"
  svg: "SVG Plugin\n• sanitization\n• responsive sizing"

  code -> features.preview.pluginRegistry: registers
  d2 -> features.preview.pluginRegistry: registers
  svg -> features.preview.pluginRegistry: registers
}

# External Systems
external: External Systems {
  shape: rectangle
  style.fill: "#f5f5f4"

  rust: "Tauri Backend (Rust)\n• filesystem commands\n• app data directory"
  wasm: "D2 WASM\n• diagram compilation"
  libs: "Libraries\n• html2pdf\n• highlight.js"
}

# Data Flow: User Input → State → UI
flow1: User Actions {
  shape: hexagon
  style.fill: "#ffeaa7"

  input: "User Input\n• type in editor\n• click note\n• create folder"
}

flow2: Event Handlers {
  shape: rectangle
  style.fill: "#fab1a0"

  handlers: "Component Handlers\n• Editor updateListener\n• FileNav click\n• TopNav buttons"
}

flow3: State Updates {
  shape: rectangle
  style.fill: "#74b9ff"

  update: "setState()\n• validates\n• persists\n• notifies"
}

flow4: UI Updates {
  shape: hexagon
  style.fill: "#a29bfe"

  render: "Subscribers React\n• editor reloads\n• preview renders\n• filenav updates"
}

# Connections: Data Flow
flow1 -> flow2: triggers
flow2 -> core.state.mutations: calls
core.state.mutations -> flow3: invokes
flow3 -> core.state.pubsub: notifies
core.state.pubsub -> flow4: triggers

# Connections: Features → Core
features.editor.codemirror -> core.state.mutations: updateNoteContent()
features.preview.checkbox -> core.state.mutations: updateNoteContent()
features.nav.filenav -> core.state.mutations: "createNote()\ncreateFolder()"

# Connections: Core → Features
core.state.pubsub -> features.editor.codemirror: "note changed\n→ reload content"
core.state.pubsub -> features.preview.marked: "note changed\n→ re-render"
core.state.pubsub -> features.nav.filenav: "notes/folders changed\n→ update tree"
core.state.pubsub -> features.nav.footer: "cursor moved\n→ update line/col"

# Connections: External
core.fs.tauri -> external.rust: "invoke() commands"
plugins.d2 -> external.wasm: "compile diagrams"
features.preview.marked -> external.libs: "uses highlight.js"

# Scroll Sync Flow
sync: Scroll Synchronization {
  shape: rectangle
  style.fill: "#fdcb6e"
  style.stroke-dash: 3

  editorScroll: "Editor scrolls"
  calcPercent: "Calculate %"
  setState: "setState({ editorScrollPercent })"
  previewUpdate: "Preview syncs position"

  editorScroll -> calcPercent
  calcPercent -> setState
  setState -> previewUpdate
}

features.editor -> sync.editorScroll: scroll event
sync.previewUpdate -> features.preview: updates scrollTop

# Persistence Flow
persist: Persistence Architecture {
  shape: rectangle
  style.fill: "#55efc4"
  style.stroke-dash: 3

  memory: "In-Memory State\n(instant updates)"
  filesystem: "File System\n(.md files)"
  metadata: "Metadata JSON\n(.markup/metadata.json)"

  memory -> filesystem: "note content"
  memory -> metadata: "UI state, positions"
}

core.state.appState -> persist.memory: lives in
core.fs.storage -> persist.filesystem: writes to
core.fs.storage -> persist.metadata: writes to

# Initialization Flow
init: Initialization Flow {
  shape: rectangle
  style.fill: "#dfe6e9"

  step1: "1. initializeState()"
  step2: "2. Load from filesystem"
  step3: "3. Init plugins"
  step4: "4. Init components"
  step5: "5. Subscribe & listen"

  step1 -> step2 -> step3 -> step4 -> step5
}

init.step5 -> core.state.pubsub: activates
init.step3 -> plugins: registers
init.step4 -> features: renders
```

## Key Architectural Patterns

### 1. **Pub/Sub Pattern** (State Management)
- Centralized state with listener array
- Components subscribe to state changes
- Loose coupling between modules

### 2. **Plugin/Registry Pattern** (Preview Renderers)
- `Map<language, renderer>` registry
- Easy to add new code block renderers
- Fallback to default renderer

### 3. **Unidirectional Data Flow**
```
User Input → Event Handler → State Mutation → setState() → Subscribers → UI Update
```

### 4. **Async Rendering** (D2 Diagrams)
- Return placeholder immediately
- Queue and debounce async work
- Cache results by hash
- Inject rendered content post-render

## Component Communication

All components communicate through the centralized **AppState**:
- No direct component-to-component calls
- State is the single source of truth
- Predictable, debuggable data flow

## File Structure Overview

```
src/
├── main.ts                    # App initialization
├── core/                      # State management & persistence
│   ├── state.ts              # AppState + pub/sub
│   ├── fs-storage.ts         # Tauri filesystem wrapper
│   └── search.ts             # Search algorithm
├── features/
│   ├── editor/               # CodeMirror integration
│   ├── preview/              # Marked.js + plugins
│   │   └── plugins/          # code, d2, svg renderers
│   ├── navigation/           # TopNav, FileNav, Search, Footer
│   └── layout/               # Layout visibility management
└── styles/                   # CSS files
```

## Extension Points

### Adding a New Preview Plugin
```typescript
// 1. Create plugin file
export function initMermaidPlugin() {
  registerCodeBlockRenderer('mermaid', (code) => {
    // Render mermaid diagram
    return html;
  });
}

// 2. Register in main.ts
import { initMermaidPlugin } from './features/preview/plugins/mermaid';
initMermaidPlugin();
```

### Adding a New Formatting Command
```typescript
// 1. Add to formatting.ts
export function applyStrikethrough(view: EditorView) {
  // Insert ~~ around selection
}

// 2. Add keymap in Editor.ts
{ key: 'Mod-s', run: (view) => { applyStrikethrough(view); return true; } }

// 3. Add button in TopNav.ts
```

## Performance Considerations

**Optimizations:**
- D2 diagram caching (max 50 entries)
- D2 render debouncing (300ms)
- Search input debouncing (150ms)
- Drag-drop activation threshold (7px)

**Potential Bottlenecks:**
- FileNav re-renders entire tree on any change
- Search scans all notes linearly
- No virtual scrolling for large trees

## Persistence Strategy

**Multi-Layer:**
1. **In-Memory** - Instant updates, single source of truth
2. **File System** - Note content (.md files) + folder structure
3. **Metadata** - UI state, scroll position, note metadata (.markup/metadata.json)
4. **Migration** - Old localStorage → filesystem (one-time)

**Atomic Updates:**
- `setState()` validates before applying
- Backup created, rolled back on error
- Async persistence doesn't block UI
