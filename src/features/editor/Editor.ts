import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldKeymap, indentUnit, HighlightStyle } from '@codemirror/language';
import { history, defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { lintKeymap } from '@codemirror/lint';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { tags as t } from '@lezer/highlight';
import { getState, updateNoteContent, getCurrentNoteContent, setState, subscribe } from '../../core';
import { codeBlockPlugin } from './CodeBlockPlugin';
import { applyBold, applyItalic, applyHeading, applyCode, applyLink, applyList } from './formatting';

let editorView: EditorView | null = null;
let scrollCleanup: (() => void) | null = null;
let stateUnsubscribe: (() => void) | null = null;
let isLoadingNote = false;
let currentLoadingNotePath: string | null = null;

const markdownHighlightStyle = HighlightStyle.define([
  { tag: t.processingInstruction, class: 'cm-formatting-header' },
  { tag: t.punctuation, class: 'cm-formatting' },
  { tag: t.contentSeparator, class: 'cm-hr' },
  { tag: t.monospace, class: 'cm-code' },
  { tag: t.labelName, class: 'cm-code-info' },
  { tag: t.link, class: 'cm-link' },
  { tag: t.url, class: 'cm-url' },
  { tag: t.meta, class: 'cm-meta' },
  { tag: t.comment, class: 'cm-comment' },
]);

const formattingKeymap = [
  { key: 'Mod-b', run: (view: EditorView) => { applyBold(view); return true; } },
  { key: 'Mod-i', run: (view: EditorView) => { applyItalic(view); return true; } },
  { key: 'Mod-h', run: (view: EditorView) => { applyHeading(view); return true; } },
  { key: 'Mod-`', run: (view: EditorView) => { applyCode(view); return true; } },
  { key: 'Mod-k', run: (view: EditorView) => { applyLink(view); return true; } },
  { key: 'Mod-l', run: (view: EditorView) => { applyList(view); return true; } },
];

export function renderEditor(): string {
  return `
    <section class="editor">
      <div class="editor__container">
        <div class="editor__instance"></div>
      </div>
    </section>
  `;
}

export function initEditor(): EditorView {
  const container = document.querySelector('.editor__instance');

  if (!container) {
    throw new Error('Editor container not found');
  }

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged && !isLoadingNote) {
      const content = update.state.doc.toString();
      const currentNotePath = getState().currentNotePath;
      if (currentNotePath && currentNotePath !== currentLoadingNotePath) {
        updateNoteContent(currentNotePath, content);
      }
    }

    if (update.selectionSet || update.docChanged) {
      const pos = update.state.selection.main.head;
      const line = update.state.doc.lineAt(pos);
      const lineNumber = line.number;
      const column = pos - line.from + 1;

      setState({
        editorLine: lineNumber,
        editorColumn: column
      });
    }
  });

  const state = EditorState.create({
    doc: getCurrentNoteContent(),
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      indentUnit.of('  '),
      EditorView.lineWrapping,
      markdown({
        base: markdownLanguage,
        codeLanguages: languages,
      }),
      codeBlockPlugin,
      syntaxHighlighting(markdownHighlightStyle),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      closeBrackets(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      keymap.of([
        ...formattingKeymap,
        indentWithTab,
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...lintKeymap,
      ]),
      updateListener,
    ],
  });

  editorView = new EditorView({
    state,
    parent: container,
  });

  const editorSection = container.closest('.editor');
  if (editorSection) {
    const handleScroll = () => {
      const scrollTop = editorSection.scrollTop;
      const scrollHeight = editorSection.scrollHeight;
      const clientHeight = editorSection.clientHeight;
      const maxScroll = scrollHeight - clientHeight;
      let scrollPercent = maxScroll > 0 ? scrollTop / maxScroll : 0;

      // Clamp to [0, 1] to handle edge cases and floating point precision
      scrollPercent = Math.max(0, Math.min(1, scrollPercent));

      setState({ editorScrollPercent: scrollPercent });
    };

    editorSection.addEventListener('scroll', handleScroll);

    scrollCleanup = () => {
      editorSection.removeEventListener('scroll', handleScroll);
    };
  }

  stateUnsubscribe = subscribe((updates) => {
    const state = getState();
    const currentNotePath = state.currentNotePath;

    if (('currentNotePath' in updates || (currentNotePath && updates.notes?.[currentNotePath])) && editorView) {
      const newContent = getCurrentNoteContent();
      const currentContent = editorView.state.doc.toString();
      const newNotePath = updates.currentNotePath;

      if (newContent !== currentContent) {
        isLoadingNote = true;
        currentLoadingNotePath = newNotePath ?? currentNotePath;

        editorView.dispatch({
          changes: {
            from: 0,
            to: editorView.state.doc.length,
            insert: newContent
          }
        });

        requestAnimationFrame(() => {
          isLoadingNote = false;
          currentLoadingNotePath = null;
        });
      }
    }

    if ('fontSize' in updates) {
      const fontSize = state.fontSize || 14;
      console.log(`Setting font size to ${fontSize}px`);
      document.documentElement.style.setProperty('--editor-font-size', `${fontSize}px`);
      document.documentElement.style.setProperty('--preview-font-size', `${fontSize}px`);
    }
  });

  const initialState = getState();
  const initialFontSize = initialState.fontSize || 14;
  console.log(`Initial font size: ${initialFontSize}px`);
  document.documentElement.style.setProperty('--editor-font-size', `${initialFontSize}px`);
  document.documentElement.style.setProperty('--preview-font-size', `${initialFontSize}px`);

  return editorView;
}

export function getEditorView(): EditorView | null {
  return editorView;
}

export function destroyEditor(): void {
  if (scrollCleanup) {
    scrollCleanup();
    scrollCleanup = null;
  }

  if (stateUnsubscribe) {
    stateUnsubscribe();
    stateUnsubscribe = null;
  }

  if (editorView) {
    editorView.destroy();
    editorView = null;
  }
}
