import { createNote, createNoteFolder as createFolder, deleteNote, getState, setState, subscribe } from '../../core';
import { ask } from '@tauri-apps/plugin-dialog';
import { icons } from './icons';

let clickHandler: ((e: Event) => void) | null = null;
let unsubscribe: (() => void) | null = null;

export function renderIconRail(): string {
  const state = getState();
  const hasCurrentNote = !!state.currentNotePath;
  const isSearchActive = state.searchMode;

  return `
    <div class="icon-rail">
      <button
        class="icon-rail__button ${isSearchActive ? 'icon-rail__button--active' : ''}"
        id="rail-search-btn"
        title="Search notes"
      >
        ${icons.search}
      </button>
      <button
        class="icon-rail__button"
        id="rail-add-folder-btn"
        title="Add new folder"
      >
        ${icons.folder}
      </button>
      <button
        class="icon-rail__button"
        id="rail-add-note-btn"
        title="Add new note"
      >
        ${icons.plus}
      </button>
      <button
        class="icon-rail__button ${!hasCurrentNote ? 'icon-rail__button--disabled' : ''}"
        id="rail-delete-btn"
        title="Delete current note"
        ${!hasCurrentNote ? 'disabled' : ''}
      >
        ${icons.trash}
      </button>
    </div>
  `;
}

function updateIconRail(): void {
  const container = document.querySelector('.icon-rail');
  if (container) {
    const state = getState();
    const hasCurrentNote = !!state.currentNotePath;
    const isSearchActive = state.searchMode;

    const searchBtn = container.querySelector('#rail-search-btn');
    const deleteBtn = container.querySelector('#rail-delete-btn');

    if (searchBtn) {
      searchBtn.classList.toggle('icon-rail__button--active', isSearchActive);
    }

    if (deleteBtn) {
      deleteBtn.classList.toggle('icon-rail__button--disabled', !hasCurrentNote);
      if (hasCurrentNote) {
        deleteBtn.removeAttribute('disabled');
      } else {
        deleteBtn.setAttribute('disabled', 'true');
      }
    }
  }
}

export function initIconRail(): void {
  const container = document.querySelector('.icon-rail');
  if (!container) {
    return;
  }

  clickHandler = (e) => {
    const target = e.target as HTMLElement;

    const searchBtn = target.closest('#rail-search-btn');
    if (searchBtn) {
      const state = getState();
      setState({ searchMode: !state.searchMode });
      return;
    }

    const addFolderBtn = target.closest('#rail-add-folder-btn');
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

    const addNoteBtn = target.closest('#rail-add-note-btn');
    if (addNoteBtn) {
      createNote();
      return;
    }

    const deleteBtn = target.closest('#rail-delete-btn');
    if (deleteBtn && !deleteBtn.hasAttribute('disabled')) {
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
  };

  container.addEventListener('click', clickHandler);

  unsubscribe = subscribe((updates) => {
    if ('searchMode' in updates || 'currentNotePath' in updates) {
      updateIconRail();
    }
  });

  updateIconRail();
}

export function destroyIconRail(): void {
  const container = document.querySelector('.icon-rail');

  if (container && clickHandler) {
    container.removeEventListener('click', clickHandler);
    clickHandler = null;
  }

  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
