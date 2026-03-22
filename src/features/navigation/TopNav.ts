import { getState, setState, subscribe } from '../../core';
import { getEditorView } from '../editor';
import { applyBold, applyItalic, applyHighlight, applyCode, applyList, applyQuote, applyTable } from '../editor/formatting';
import { icons } from './icons';

let clickHandler: ((e: Event) => void) | null = null;
let unsubscribe: (() => void) | null = null;

export function renderTopNav(): string {
  const state = getState();
  const currentNote = state.currentNotePath ? state.notes[state.currentNotePath] : null;
  const noteTitle = currentNote?.title || 'Untitled Note';

  return `
    <nav class="top-nav">
      <div class="top-nav__left">
        <div class="top-nav__brand">
          ${icons.logo}
        </div>
        <div class="top-nav__formatting">
          <button class="top-nav__btn top-nav__btn--format" id="format-bold-btn" title="Bold (Ctrl+B)">
            ${icons.bold}
          </button>
          <button class="top-nav__btn top-nav__btn--format" id="format-italic-btn" title="Italic (Ctrl+I)">
            ${icons.italic}
          </button>
          <button class="top-nav__btn top-nav__btn--format" id="format-highlight-btn" title="Highlight">
            ${icons.highlight}
          </button>
          <button class="top-nav__btn top-nav__btn--format" id="format-code-btn" title="Code (Ctrl+\`)">
            ${icons.code}
          </button>
          <button class="top-nav__btn top-nav__btn--format" id="format-list-btn" title="Bulleted List (Ctrl+L)">
            ${icons.list}
          </button>
          <button class="top-nav__btn top-nav__btn--format" id="format-quote-btn" title="Quote">
            ${icons.quote}
          </button>
          <button class="top-nav__btn top-nav__btn--format" id="format-table-btn" title="Table">
            ${icons.table}
          </button>
        </div>
      </div>
      <div class="top-nav__center">
        <span class="top-nav__note-title">${noteTitle}</span>
      </div>
      <div class="top-nav__right">
        <div class="top-nav__layout-controls">
          <button class="top-nav__btn top-nav__btn--layout" id="toggle-editor-btn" title="Editor">
            ${icons.layoutEditor}
          </button>
          <button class="top-nav__btn top-nav__btn--layout" id="toggle-filenav-btn" title="Split">
            ${icons.layoutFileNav}
          </button>
          <button class="top-nav__btn top-nav__btn--layout" id="toggle-preview-btn" title="Preview">
            ${icons.layoutPreview}
          </button>
        </div>
      </div>
    </nav>
  `;
}

export function initTopNav(): void {
  const topNav = document.querySelector('.top-nav');
  if (!topNav) {
    return;
  }

  clickHandler = (e) => {
    const target = e.target as HTMLElement;

    const toggleFileNavBtn = target.closest('#toggle-filenav-btn');
    if (toggleFileNavBtn) {
      const state = getState();
      setState({ showFileNav: !state.showFileNav });
      return;
    }

    const toggleEditorBtn = target.closest('#toggle-editor-btn');
    if (toggleEditorBtn) {
      const state = getState();
      setState({ showEditor: !state.showEditor });
      return;
    }

    const togglePreviewBtn = target.closest('#toggle-preview-btn');
    if (togglePreviewBtn) {
      const state = getState();
      setState({ showPreview: !state.showPreview });
      return;
    }

    const editorView = getEditorView();
    if (!editorView) {
      return;
    }

    const formatBoldBtn = target.closest('#format-bold-btn');
    if (formatBoldBtn) {
      applyBold(editorView);
      return;
    }

    const formatItalicBtn = target.closest('#format-italic-btn');
    if (formatItalicBtn) {
      applyItalic(editorView);
      return;
    }

    const formatHighlightBtn = target.closest('#format-highlight-btn');
    if (formatHighlightBtn) {
      applyHighlight(editorView);
      return;
    }

    const formatCodeBtn = target.closest('#format-code-btn');
    if (formatCodeBtn) {
      applyCode(editorView);
      return;
    }

    const formatListBtn = target.closest('#format-list-btn');
    if (formatListBtn) {
      applyList(editorView);
      return;
    }

    const formatQuoteBtn = target.closest('#format-quote-btn');
    if (formatQuoteBtn) {
      applyQuote(editorView);
      return;
    }

    const formatTableBtn = target.closest('#format-table-btn');
    if (formatTableBtn) {
      applyTable(editorView);
      return;
    }
  };

  topNav.addEventListener('click', clickHandler);

  const updateToggleStates = () => {
    const state = getState();
    const fileNavBtn = document.querySelector('#toggle-filenav-btn');
    const editorBtn = document.querySelector('#toggle-editor-btn');
    const previewBtn = document.querySelector('#toggle-preview-btn');

    if (fileNavBtn) {
      fileNavBtn.classList.toggle('top-nav__btn--is-active', state.showFileNav);
    }
    if (editorBtn) {
      editorBtn.classList.toggle('top-nav__btn--is-active', state.showEditor);
    }
    if (previewBtn) {
      previewBtn.classList.toggle('top-nav__btn--is-active', state.showPreview);
    }
  };

  const updateTitle = () => {
    const state = getState();
    const currentNote = state.currentNotePath ? state.notes[state.currentNotePath] : null;
    const noteTitle = currentNote?.title || 'Untitled Note';

    const titleElement = document.querySelector('.top-nav__note-title');
    if (titleElement) {
      titleElement.textContent = noteTitle;
    }
  };

  updateToggleStates();
  updateTitle();

  unsubscribe = subscribe((updates) => {
    if ('showFileNav' in updates || 'showEditor' in updates || 'showPreview' in updates) {
      updateToggleStates();
    }
    if ('currentNotePath' in updates || 'notes' in updates || 'folders' in updates) {
      updateTitle();
    }
  });
}

export function destroyTopNav(): void {
  const topNav = document.querySelector('.top-nav');

  if (topNav && clickHandler) {
    topNav.removeEventListener('click', clickHandler);
    clickHandler = null;
  }

  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
