# Markup CSS Architecture

## CSS System Architecture

```d2
direction: right

title: {
  label: CSS Architecture & Composition
  near: top-center
  shape: text
  style.font-size: 24
  style.bold: true
}

# Foundation Layer
foundation: Foundation Layer {
  shape: rectangle
  style.fill: "#e8f4f8"

  variables: CSS Variables (Design Tokens) {
    shape: cylinder
    style.fill: "#d4e8ff"

    colors: "Colors\n• --color-text\n• --color-background\n• --color-accent\n• --color-border"
    typography: "Typography\n• --font-family-base\n• --font-size-base\n• --font-weight-*\n• --line-height-*"
    spacing: "Spacing\n• --spacing-xs → xxxl\n• --nav-height\n• --file-nav-width"
    effects: "Effects\n• --border-radius\n• --shadow-*\n• --transition-*"

    colors -> typography
    typography -> spacing
    spacing -> effects
  }

  global: Global Base Styles {
    shape: rectangle
    style.fill: "#ffe8d4"

    reset: "CSS Reset\n• margin: 0\n• padding: 0\n• box-sizing: border-box"
    elements: "Element Defaults\n• body, html\n• h1-h6, p, ul, ol\n• a, button, input"
    scrollbar: "Custom Scrollbar\n• macOS-native feel\n• webkit pseudo-elements"
    userSelect: "User Select\n• none (default)\n• text (editor/preview)"

    reset -> elements
    elements -> scrollbar
    scrollbar -> userSelect
  }

  variables.colors -> global.elements: provides colors
  variables.typography -> global.elements: provides fonts
  variables.spacing -> global.elements: provides spacing
}

# Layout Layer
layout: Layout Layer {
  shape: rectangle
  style.fill: "#d4ffe8"

  structure: Layout Structure {
    shape: rectangle
    style.fill: "#b8f7d4"

    flex: ".layout\n• display: flex\n• flex-direction: column\n• height: 100vh"
    sections: "Layout Sections\n• __top (TopNav)\n• __content (3-column)\n• __footer (Footer)"
    columns: "Content Columns\n• __file-nav (240px)\n• __editor (flex: 1)\n• __preview (flex: 1)"
    visibility: "Visibility Classes\n• --hidden (display: none)\n• Toggled by layout.ts"

    flex -> sections
    sections -> columns
    columns -> visibility
  }
}

# Component Layer
components: Component Styles {
  shape: rectangle
  style.fill: "#ffd4e8"

  navigation: Navigation Components {
    shape: rectangle
    style.fill: "#ffb3d9"

    topnav: "TopNav.css\n• BEM: .top-nav__*\n• Grid layout\n• Button states"
    filenav: "FileNav.css\n• BEM: .file-nav__*\n• Tree structure\n• Drag states"
    search: "SearchPanel.css\n• BEM: .search-panel__*\n• Input + results"
    footer: "Footer.css\n• BEM: .footer__*\n• Status bar"
  }

  content: Content Components {
    shape: rectangle
    style.fill: "#ffc4d1"

    editor: "Editor.css\n• BEM: .editor__*\n• CodeMirror overrides\n• Syntax highlighting"
    preview: "Preview.css\n• BEM: .preview\n• Markdown rendering\n• Task lists"
  }

  plugins: Plugin Styles {
    shape: rectangle
    style.fill: "#ffaac4"

    code: "code.css\n• .code-block\n• highlight.js theme"
    d2: "d2.css\n• .d2-diagram\n• controls overlay"
    svg: "svg.css\n• .svg-diagram\n• responsive sizing"
    codeblock: "CodeBlockPlugin.css\n• .cm-code-block\n• decorations"
  }
}

# Naming Convention System
naming: BEM Naming Convention {
  shape: rectangle
  style.fill: "#fff4d4"
  style.stroke-dash: 3

  block: "Block\n.component"
  element: "Element\n.component__element"
  modifier: "Modifier\n.component--modifier\n.component__element--modifier"
  state: "State Classes\n.component--active\n.component--hidden\n.component--dragging"

  block -> element: contains
  element -> modifier: variation
  block -> modifier: variation
  modifier -> state: examples
}

# Style Composition Flow
composition: Style Composition {
  shape: hexagon
  style.fill: "#ffeaa7"

  step1: "1. CSS Variables defined\n(variables.css)"
  step2: "2. Global styles applied\n(global.css)"
  step3: "3. Layout structure\n(layout.css)"
  step4: "4. Component styles\n(component.css)"
  step5: "5. Final computed styles"

  step1 -> step2
  step2 -> step3
  step3 -> step4
  step4 -> step5
}

# Dependencies
foundation.variables -> layout.structure: provides tokens
foundation.global -> layout.structure: base styles
layout.structure -> components.navigation: contains
layout.structure -> components.content: contains

components.content.editor -> components.plugins.codeblock: uses
components.content.preview -> components.plugins.code: uses
components.content.preview -> components.plugins.d2: uses
components.content.preview -> components.plugins.svg: uses

foundation.variables -> components.navigation: tokens
foundation.variables -> components.content: tokens
foundation.variables -> components.plugins: tokens

# Style Cascade
cascade: Style Cascade Order {
  shape: rectangle
  style.fill: "#a29bfe"
  style.stroke-dash: 3

  browser: "Browser Defaults"
  variables: "CSS Variables (:root)"
  reset: "Global Reset (*)"
  base: "Base Elements (h1, p, etc.)"
  layout: "Layout Classes (.layout__*)"
  component: "Component Classes (.top-nav__*)"
  state: "State Classes (--active, --hidden)"
  inline: "Inline Styles (avoid)"

  browser -> variables
  variables -> reset
  reset -> base
  base -> layout
  layout -> component
  component -> state
  state -> inline
}

# Design Token Categories
tokens: Design Token System {
  shape: rectangle
  style.fill: "#74b9ff"

  semantic: Semantic Tokens {
    shape: rectangle

    text: "Text Colors\n• primary: #1c1c1e\n• light: #6e6e73\n• muted: #a1a1a6"
    bg: "Backgrounds\n• editor: #fafaf9\n• preview: #fffcf7\n• sidebar: #f5f5f4"
    accent: "Accent\n• primary: #7985a3\n• muted: #939eb8"
    borders: "Borders\n• standard: #e7e7e5\n• light: #ebebea\n• hairline: #f2f2f1"
  }

  scale: Scale Tokens {
    shape: rectangle

    fontSizes: "Font Sizes\n• xs: 11px\n• sm: 12px\n• base: 13px\n• lg-xxl: 15-26px"
    spacing: "Spacing Scale\n• xs: 0.25rem\n• sm: 0.5rem\n• md-xxxl: 0.75-3rem"
    weights: "Font Weights\n• normal: 400\n• medium: 500\n• semibold: 600\n• bold: 700"
  }
}

foundation.variables.colors -> tokens.semantic: defined as
foundation.variables.typography -> tokens.scale: defined as
foundation.variables.spacing -> tokens.scale: defined as

# Component Style Patterns
patterns: Component Style Patterns {
  shape: rectangle
  style.fill: "#fab1a0"
  style.stroke-dash: 3

  container: "Container Pattern\n• Outer wrapper (.component)\n• Inner container (.component__container)\n• Padding + overflow"

  item: "Item Pattern\n• List wrapper (.component__list)\n• Item (.component__item)\n• Item content (.component__item-*)"

  button: "Button Pattern\n• Base (.component__btn)\n• Hover state (:hover)\n• Active state (.component__btn--active)"

  input: "Input Pattern\n• Base input styling\n• Focus state\n• Validation states"
}

components -> patterns: follows
```

## Navigation Guide

### Finding Styles for a Component

```d2
direction: down

guide: Style Navigation Guide {
  shape: rectangle
  style.fill: "#dfe6e9"

  question1: "Need to style TopNav?"
  answer1: "→ features/navigation/TopNav.css\n→ Uses .top-nav__* classes"

  question2: "Need to change colors?"
  answer2: "→ styles/variables.css\n→ Modify --color-* tokens"

  question3: "Need to adjust spacing?"
  answer3: "→ styles/variables.css\n→ Use --spacing-* tokens"

  question4: "Need to style markdown?"
  answer4: "→ features/preview/Preview.css\n→ .preview h1, .preview p, etc."

  question5: "Need to change layout?"
  answer5: "→ features/layout/layout.css\n→ .layout__* classes"

  question6: "Need plugin styles?"
  answer6: "→ features/preview/plugins/*.css\n→ .code-block, .d2-diagram, etc."

  question1 -> answer1
  question2 -> answer2
  question3 -> answer3
  question4 -> answer4
  question5 -> answer5
  question6 -> answer6
}
```

## File Structure Map

```
src/styles/
├── variables.css          ← All CSS custom properties
└── global.css             ← CSS reset + base element styles

src/features/layout/
└── layout.css             ← Layout structure (.layout, .layout__*)

src/features/navigation/
├── TopNav.css             ← Top toolbar (.top-nav__*)
├── FileNav.css            ← File tree sidebar (.file-nav__*)
├── SearchPanel.css        ← Search UI (.search-panel__*)
└── Footer.css             ← Status bar (.footer__*)

src/features/editor/
├── Editor.css             ← Editor styles (.editor__*)
└── CodeBlockPlugin.css    ← CodeMirror decorations (.cm-code-block)

src/features/preview/
├── Preview.css            ← Markdown rendering (.preview)
└── plugins/
    ├── code.css           ← Code highlighting (.code-block)
    ├── d2.css             ← D2 diagrams (.d2-diagram)
    └── svg.css            ← SVG rendering (.svg-diagram)
```

## CSS Custom Properties Reference

### Color Tokens
```css
/* Text */
--color-text: #1c1c1e           /* Primary text */
--color-text-light: #6e6e73     /* Secondary text */
--color-text-muted: #a1a1a6     /* Tertiary text */

/* Backgrounds */
--color-background: #fafaf9
--color-background-editor: #fafaf9
--color-background-preview: #fffcf7
--color-background-sidebar: #f5f5f4
--color-background-nav: #fdfdfb

/* Accents */
--color-accent: #7985a3
--color-accent-muted: #939eb8

/* Borders */
--color-border: #e7e7e5
--color-border-light: #ebebea
--color-border-hairline: #f2f2f1

/* Interactive */
--color-hover: rgba(0, 0, 0, 0.04)
--color-active: rgba(0, 0, 0, 0.06)
```

### Typography Tokens
```css
/* Font Families */
--font-family-base: -apple-system, BlinkMacSystemFont, ...
--font-family-mono: "SF Mono", Monaco, Consolas, ...

/* Font Sizes */
--font-size-xs: 11px
--font-size-sm: 12px
--font-size-base: 13px
--font-size-lg: 15px
--font-size-xl: 20px
--font-size-xxl: 26px

/* Font Weights */
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700

/* Line Heights */
--line-height-base: 1.65
--line-height-tight: 1.35
--line-height-relaxed: 1.7
--line-height-heading: 1.25
```

### Spacing Tokens
```css
--spacing-xs: 0.25rem      /* 4px */
--spacing-sm: 0.5rem       /* 8px */
--spacing-md: 0.75rem      /* 12px */
--spacing-lg: 1rem         /* 16px */
--spacing-xl: 1.5rem       /* 24px */
--spacing-xxl: 2rem        /* 32px */
--spacing-xxxl: 3rem       /* 48px */
```

### Layout Tokens
```css
--nav-height: 52px
--toolbar-height: 52px
--footer-height: 28px
--file-nav-width: 240px
```

### Effect Tokens
```css
/* Border Radius */
--border-radius: 6px
--border-radius-sm: 4px
--border-width: 1px

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04)
--shadow-md: 0 2px 4px rgba(0, 0, 0, 0.06)
--shadow-lg: 0 4px 8px rgba(0, 0, 0, 0.08)

/* Transitions */
--transition-speed: 0.2s
--transition-smooth: cubic-bezier(0.4, 0, 0.2, 1)
```

## BEM Naming Convention

Markup uses a **BEM-like** naming convention for component styles:

### Pattern
```
.block                      /* Component root */
.block__element             /* Component child element */
.block__element--modifier   /* Element variation */
.block--modifier            /* Block variation */
```

### Examples
```css
/* TopNav Component */
.top-nav                    /* Root container */
.top-nav__left              /* Left section */
.top-nav__btn               /* Button element */
.top-nav__btn--is-active    /* Active button state */
.top-nav__btn--format       /* Format button variation */

/* FileNav Component */
.file-nav                   /* Root container */
.file-nav__container        /* Inner wrapper */
.file-nav__item             /* Tree item */
.file-nav__item--active     /* Selected item */
.file-nav__item--dragging   /* Dragging state */
.file-nav__folder           /* Folder element */
.file-nav__folder--expanded /* Expanded folder */

/* Preview Component */
.preview                    /* Root (no underscore for rendered content) */
.preview h1                 /* Direct descendant styling */
.preview input[type="checkbox"]  /* Task list checkboxes */
```

## Common Style Patterns

### Container Pattern
Most components follow this structure:
```css
.component {
  /* Outer wrapper - positioning, size, background */
  height: 100%;
  overflow: auto;
}

.component__container {
  /* Inner container - padding, content flow */
  padding: var(--spacing-xl) var(--spacing-lg);
}
```

### Item/List Pattern
For repeating elements (FileNav, SearchPanel):
```css
.component__list {
  /* List wrapper */
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.component__item {
  /* Individual item */
  padding: 10px 12px;
  cursor: pointer;
  transition: background var(--transition-speed);
}

.component__item:hover {
  background: var(--color-hover);
}

.component__item--active {
  background: var(--color-active);
}
```

### Button Pattern
Consistent button styling:
```css
.component__btn {
  /* Base button */
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all var(--transition-speed);
}

.component__btn:hover {
  background: var(--color-hover);
}

.component__btn:active {
  background: var(--color-active);
}

.component__btn--is-active {
  background: var(--color-active);
}
```

## Style Composition Rules

### 1. Always Use CSS Variables
```css
/* ✅ Good */
.component {
  color: var(--color-text);
  padding: var(--spacing-md);
}

/* ❌ Bad */
.component {
  color: #1c1c1e;
  padding: 12px;
}
```

### 2. Follow BEM Naming
```css
/* ✅ Good */
.top-nav__btn--is-active { }

/* ❌ Bad */
.topNavBtnActive { }
.top-nav .btn.active { }
```

### 3. Scope Component Styles
```css
/* ✅ Good - Scoped to component */
.file-nav__item {
  padding: 10px;
}

/* ❌ Bad - Too generic */
.item {
  padding: 10px;
}
```

### 4. Use Semantic Class Names
```css
/* ✅ Good - Describes purpose */
.top-nav__btn--is-active
.file-nav__item--dragging
.preview__container

/* ❌ Bad - Describes appearance */
.blue-button
.big-padding
.left-aligned
```

## Modifying Styles Guide

### Changing a Color Globally
1. Open `src/styles/variables.css`
2. Modify the `--color-*` variable
3. All components using that token will update

### Changing Component-Specific Styles
1. Find component name (e.g., "TopNav")
2. Open `src/features/[module]/[Component].css`
3. Find the relevant BEM class (e.g., `.top-nav__btn`)
4. Modify styles

### Adding New Component Styles
1. Create `ComponentName.css` in appropriate feature folder
2. Import in `main.ts` or component's index file
3. Use BEM naming: `.component-name`, `.component-name__element`
4. Use CSS variables for colors, spacing, typography

### Overriding Third-Party Styles
```css
/* CodeMirror overrides in Editor.css */
.editor__instance .cm-editor { }
.editor__instance .cm-gutters { }

/* Marked.js output in Preview.css */
.preview h1 { }
.preview code { }
```

## Responsive Considerations

Markup is a **desktop-only** application. There are no media queries or responsive breakpoints. All sizing is fixed or uses flexbox for adaptable layouts.

### Flexbox-Based Responsiveness
```css
/* Layout adapts to window size via flex */
.layout__editor {
  flex: 1;              /* Grows to fill space */
  min-width: 0;         /* Allows shrinking */
}

.layout__file-nav {
  width: var(--file-nav-width);  /* Fixed width */
  flex-shrink: 0;       /* Never shrinks */
}
```

## Performance Considerations

### CSS Loading Order
1. `variables.css` - Loaded first (defines tokens)
2. `global.css` - Base styles
3. `layout.css` - Layout structure
4. Component CSS files - Loaded as needed

### Optimization Techniques
- **CSS Variables** - One source of truth, easy updates
- **Simple Selectors** - Mostly class-based, fast matching
- **No Deep Nesting** - BEM avoids selector complexity
- **Minimal Overrides** - Each component owns its styles
- **Scoped Transitions** - Only animate what changes

## Debugging Styles

### Finding Which File Defines a Style
1. Inspect element in DevTools
2. Look at class name (e.g., `.top-nav__btn`)
3. Match to file: `TopNav.css` has `.top-nav__*` classes

### Understanding Style Cascade
1. Check if CSS variable is defined: `src/styles/variables.css`
2. Check global reset: `src/styles/global.css`
3. Check layout: `src/features/layout/layout.css`
4. Check component: `src/features/[module]/[Component].css`

### Common Issues

**Colors not updating:**
- Check if component uses CSS variable: `var(--color-*)`
- If hardcoded, update in component CSS file

**Spacing inconsistent:**
- Use spacing tokens: `var(--spacing-md)`
- Check if component has custom padding/margin

**Layout breaking:**
- Check `.layout__*` classes in `layout.css`
- Verify flexbox properties (flex, min-width)

**Third-party styles not applying:**
- Check selector specificity
- May need to override with `.component .third-party-class`

## Summary

**CSS Architecture Principles:**
1. **Token-Based** - CSS variables for all design decisions
2. **BEM Naming** - Predictable, scoped class names
3. **Component-Scoped** - Each component owns its styles
4. **Composition** - Variables → Global → Layout → Components
5. **Maintainable** - Clear file structure, semantic names

**Quick Reference:**
- Colors, spacing, typography → `variables.css`
- Layout structure → `layout.css`
- Component styles → `features/[module]/[Component].css`
- Global resets, scrollbar → `global.css`
