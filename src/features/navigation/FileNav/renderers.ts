import { getState, Note, Folder } from '../../../core';
import { CONSTANTS } from './constants';
import { sortNotes, sortFolders, truncateTitle, formatDate, escapeHtml } from './utils';

export function renderFileNav(): string {
  const state = getState();
  const isSearchActive = state.searchMode;

  return `
    <aside class="file-nav">
      <div class="file-nav__header">
        <div class="file-nav__header-title">Notes</div>
        <div class="file-nav__header-controls">
          <button class="file-nav__header-button ${isSearchActive ? 'file-nav__header-button--active' : ''}" id="file-nav-search-btn" title="Search notes">
            <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8.5" cy="8.5" r="5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M 12 12 L 16 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="file-nav__container">
        <div class="file-nav__list" id="file-nav-list">
          ${renderFileTree()}
        </div>
      </div>
    </aside>
  `;
}

export function renderNoteItem(note: Note, isActive: boolean): string {
  const activeClass = isActive ? CONSTANTS.CLASSES.ACTIVE : '';
  const displayTitle = truncateTitle(note.title);
  const formattedDate = formatDate(note.modifiedAt);

  return `
    <div class="file-nav__item ${activeClass}"
         data-note-path="${note.path}"
         data-folder-path="${note.folderPath || ''}"
         draggable="true">
      <div class="file-nav__item-content">
        <div class="file-nav__item-title">${escapeHtml(displayTitle)}</div>
        <div class="file-nav__item-date">${formattedDate}</div>
      </div>
    </div>
  `;
}

export function renderFolder(folder: Folder, notesInFolder: Note[], subfoldersInFolder: Folder[], currentNotePath: string | null, depth: number = 0): string {
  if (depth > 1) {
    return '';
  }

  const state = getState();
  const expandedClass = folder.isExpanded ? CONSTANTS.CLASSES.EXPANDED : CONSTANTS.CLASSES.COLLAPSED;
  const chevron = folder.isExpanded ? '▼' : '▶';
  const hasContent = notesInFolder.length > 0 || subfoldersInFolder.length > 0;

  let folderContent = '';
  if (folder.isExpanded && hasContent && depth < 1) {
    const sortedSubfolders = sortFolders(subfoldersInFolder);
    const sortedNotes = sortNotes(notesInFolder);

    folderContent = `
      <div class="file-nav__folder-content">
        ${sortedSubfolders.map(subfolder => {
          const subNotesInFolder = Object.values(state.notes).filter(n => n.folderPath === subfolder.path);
          const subSubfoldersInFolder = Object.values(state.folders).filter(f => f.parentPath === subfolder.path);
          return renderFolder(subfolder, subNotesInFolder, subSubfoldersInFolder, currentNotePath, depth + 1);
        }).join('')}
        ${sortedNotes.map(note => renderNoteItem(note, note.path === currentNotePath)).join('')}
      </div>
    `;
  }

  return `
    <div class="file-nav__folder ${expandedClass}"
         data-folder-path="${folder.path}"
         data-parent-path="${folder.parentPath || ''}"
         data-depth="${depth}">
      <div class="file-nav__folder-header" draggable="true" data-folder-path="${folder.path}">
        <span class="file-nav__folder-chevron">${chevron}</span>
        <span class="file-nav__folder-name" data-folder-path="${folder.path}">${escapeHtml(folder.name)}</span>
      </div>
      ${folderContent}
    </div>
  `;
}

export function renderFileTree(): string {
  const state = getState();
  const rootNotes = Object.values(state.notes).filter(n => n.folderPath === null);
  const rootFolders = Object.values(state.folders).filter(f => f.parentPath === null);

  if (rootNotes.length === 0 && rootFolders.length === 0) {
    return '<div class="file-nav__empty">No notes yet</div>';
  }

  const sortedFolders = sortFolders(rootFolders);
  const sortedNotes = sortNotes(rootNotes);

  return `
    ${sortedFolders.map(folder => {
      const notesInFolder = Object.values(state.notes).filter(n => n.folderPath === folder.path);
      const subfoldersInFolder = Object.values(state.folders).filter(f => f.parentPath === folder.path);
      return renderFolder(folder, notesInFolder, subfoldersInFolder, state.currentNotePath);
    }).join('')}
    ${sortedNotes.map(note => renderNoteItem(note, note.path === state.currentNotePath)).join('')}
  `;
}

export function updateFileTree(): void {
  const listContainer = document.getElementById(CONSTANTS.SELECTORS.LIST.slice(1));
  if (listContainer) {
    listContainer.innerHTML = renderFileTree();
  }
}
