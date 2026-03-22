import { subscribe, getState, setState } from '../../../core';
import { CONSTANTS } from './constants';
import { renderFileNav, updateFileTree } from './renderers';
import {
  handleSelectNote,
  handleFolderToggle,
  handleFolderRename,
  editingFolderPath,
  resetEditingState
} from './handlers';
import { setupDragAndDrop, cleanupDragDrop } from './dragDrop';
import { handleContextMenu, setupContextMenuCleanup, cleanupContextMenu } from './contextMenu';

let unsubscribe: (() => void) | null = null;
let clickHandler: ((e: Event) => void) | null = null;
let dblclickHandler: ((e: Event) => void) | null = null;
let contextMenuHandler: ((e: Event) => void) | null = null;

function setupEventListeners(container: Element): void {
  clickHandler = (e) => {
    const target = e.target as HTMLElement;

    const searchBtn = target.closest('#file-nav-search-btn');
    if (searchBtn) {
      const state = getState();
      setState({ searchMode: !state.searchMode });
      return;
    }

    const folderHeader = target.closest('.file-nav__folder-header') as HTMLElement;
    if (folderHeader) {
      const folderPath = folderHeader.getAttribute('data-folder-path');
      if (folderPath) {
        handleFolderToggle(folderPath);
      }
      return;
    }

    const noteItem = target.closest(CONSTANTS.SELECTORS.NOTE_ITEM) as HTMLElement;
    if (noteItem) {
      const notePath = noteItem.getAttribute('data-note-path');
      if (notePath) {
        handleSelectNote(notePath);
      }
      return;
    }
  };

  dblclickHandler = (e) => {
    const target = e.target as HTMLElement;
    const folderName = target.closest(CONSTANTS.SELECTORS.FOLDER_NAME) as HTMLElement;

    if (folderName && !editingFolderPath) {
      const folderPath = folderName.getAttribute('data-folder-path');
      if (folderPath) {
        handleFolderRename(folderPath);
      }
    }
  };

  contextMenuHandler = (e) => {
    handleContextMenu(e as MouseEvent);
  };

  container.addEventListener('click', clickHandler);
  container.addEventListener('dblclick', dblclickHandler);
  container.addEventListener('contextmenu', contextMenuHandler);
}

function updateSearchButton(): void {
  const state = getState();
  const searchBtn = document.querySelector('#file-nav-search-btn');
  if (searchBtn) {
    searchBtn.classList.toggle('file-nav__header-button--active', state.searchMode);
  }
}

function setupStateSubscription(): void {
  unsubscribe = subscribe((updates) => {
    if ('notes' in updates || 'currentNotePath' in updates || 'folders' in updates) {
      updateFileTree();
    }
    if ('searchMode' in updates) {
      updateSearchButton();
    }
  });
}

export function initFileNav(): void {
  const container = document.querySelector(CONSTANTS.SELECTORS.CONTAINER);
  if (!container) {
    return;
  }

  setupEventListeners(container);
  setupDragAndDrop(container);
  setupStateSubscription();
  setupContextMenuCleanup();
}

export function destroyFileNav(): void {
  const container = document.querySelector(CONSTANTS.SELECTORS.CONTAINER);

  if (container && clickHandler) {
    container.removeEventListener('click', clickHandler);
    clickHandler = null;
  }

  if (container && dblclickHandler) {
    container.removeEventListener('dblclick', dblclickHandler);
    dblclickHandler = null;
  }

  if (container && contextMenuHandler) {
    container.removeEventListener('contextmenu', contextMenuHandler);
    contextMenuHandler = null;
  }

  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  resetEditingState();
  cleanupDragDrop();
  cleanupContextMenu();
}

export { renderFileNav };
