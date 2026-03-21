import { createNote, createNoteFolder as createFolder, deleteNote, getState, setState, subscribe } from '../../core';
import { ask } from '@tauri-apps/plugin-dialog';
import { getEditorView } from '../editor';
import { applyBold, applyItalic, applyHeading, applyCode, applyLink, applyList, applyQuote, applyTable } from '../editor/formatting';
import { exportPreviewToPdf } from '../preview/exportPdf';
import { icons } from './icons';

let clickHandler: ((e: Event) => void) | null = null;
let unsubscribe: (() => void) | null = null;

export function renderTopNav(): string {
  return `
    <nav class="top-nav">
      <div class="top-nav__left">
        <div class="top-nav__logo">
          ${icons.logo}
        </div>
        <div class="top-nav__actions">
          <button class="top-nav__btn" id="toggle-search-btn" title="Search notes">
            ${icons.search}
          </button>
          <button class="top-nav__btn" id="add-folder-btn" title="Add new folder">
            ${icons.folder}
          </button>
          <button class="top-nav__btn" id="add-note-btn" title="Add new note">
            ${icons.plus}
          </button>
          <button class="top-nav__btn" id="delete-note-btn" title="Delete current note">
            ${icons.trash}
          </button>
        </div>
      </div>
      <div class="top-nav__center">
        <div class="top-nav__formatting">
          <button class="top-nav__btn top-nav__btn--format" id="format-bold-btn" title="Bold (Ctrl+B)">
            ${icons.bold}
          </button>
          <button class="top-nav__btn top-nav__btn--format" id="format-italic-btn" title="Italic (Ctrl+I)">
            ${icons.italic}
          </button>
          <button class="top-nav__btn top-nav__btn--format" id="format-heading-btn" title="Heading (Ctrl+H)">
            ${icons.heading}
          </button>
          <button class="top-nav__btn top-nav__btn--format" id="format-code-btn" title="Code (Ctrl+\`)">
            ${icons.code}
          </button>
          <button class="top-nav__btn top-nav__btn--format" id="format-link-btn" title="Link (Ctrl+K)">
            ${icons.link}
          </button>
          <button class="top-nav__btn top-nav__btn--format" id="format-list-btn" title="List (Ctrl+L)">
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
      <div class="top-nav__right">
        <button class="top-nav__btn" id="export-pdf-btn" title="Export to PDF">
          ${icons.pdf}
        </button>
        <div class="top-nav__layout-controls">
          <button class="top-nav__btn" id="toggle-filenav-btn" title="Toggle file navigation">
            ${icons.layoutFileNav}
          </button>
          <button class="top-nav__btn" id="toggle-editor-btn" title="Toggle editor">
            ${icons.layoutEditor}
          </button>
          <button class="top-nav__btn" id="toggle-preview-btn" title="Toggle preview">
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

    const addNoteBtn = target.closest('#add-note-btn');
    if (addNoteBtn) {
      createNote();
      return;
    }

    const addFolderBtn = target.closest('#add-folder-btn');
    if (addFolderBtn) {
      createFolder('New Folder').then((folder) => {
        setTimeout(() => {
          const folderNameElement = document.querySelector(
            `.file-nav__folder-name[data-folder-path="${folder.path}"]`
          ) as HTMLElement;

          if (folderNameElement) {
            folderNameElement.dispatchEvent(new Event('dblclick', { bubbles: true }));
          }
        }, 100);
      });
      return;
    }

    const deleteBtn = target.closest('#delete-note-btn');
    if (deleteBtn) {
      const state = getState();
      const currentNotePath = state.currentNotePath;

      if (!currentNotePath) {
        return;
      }

      const note = state.notes[currentNotePath];
      if (!note) {
        return;
      }

      ask(`Are you sure you want to delete "${note.title}"?`, {
        title: 'Delete Note',
        kind: 'warning',
      }).then((confirmDelete) => {
        if (confirmDelete) {
          deleteNote(currentNotePath);
        }
      });
      return;
    }

    const exportPdfBtn = target.closest('#export-pdf-btn');
    if (exportPdfBtn) {
      exportPreviewToPdf();
      return;
    }

    const toggleSearchBtn = target.closest('#toggle-search-btn');
    if (toggleSearchBtn) {
      const state = getState();
      setState({ searchMode: !state.searchMode });
      return;
    }

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

    const formatHeadingBtn = target.closest('#format-heading-btn');
    if (formatHeadingBtn) {
      applyHeading(editorView);
      return;
    }

    const formatCodeBtn = target.closest('#format-code-btn');
    if (formatCodeBtn) {
      applyCode(editorView);
      return;
    }

    const formatLinkBtn = target.closest('#format-link-btn');
    if (formatLinkBtn) {
      applyLink(editorView);
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
    const searchBtn = document.querySelector('#toggle-search-btn');
    const fileNavBtn = document.querySelector('#toggle-filenav-btn');
    const editorBtn = document.querySelector('#toggle-editor-btn');
    const previewBtn = document.querySelector('#toggle-preview-btn');

    if (searchBtn) {
      searchBtn.classList.toggle('top-nav__btn--is-active', state.searchMode);
    }
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

  updateToggleStates();

  unsubscribe = subscribe((updates) => {
    if ('showFileNav' in updates || 'showEditor' in updates || 'showPreview' in updates || 'searchMode' in updates) {
      updateToggleStates();
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
