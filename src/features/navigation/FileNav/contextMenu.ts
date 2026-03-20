import { deleteNote, deleteNoteFolder, getState } from '../../../core';
import { ask } from '@tauri-apps/plugin-dialog';
import { handleFolderRename } from './handlers';

let contextMenu: HTMLElement | null = null;

function createContextMenu(): HTMLElement {
  const menu = document.createElement('div');
  menu.className = 'file-nav__context-menu';
  menu.style.display = 'none';
  document.body.appendChild(menu);
  return menu;
}

function showContextMenu(x: number, y: number, items: Array<{ label: string, action: () => void }>) {
  if (!contextMenu) {
    contextMenu = createContextMenu();
  }

  contextMenu.innerHTML = items.map(item =>
    `<div class="file-nav__context-menu-item">${item.label}</div>`
  ).join('');

  const menuItems = contextMenu.querySelectorAll('.file-nav__context-menu-item');
  menuItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      items[index].action();
      hideContextMenu();
    });
  });

  contextMenu.style.display = 'block';
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;

  const rect = contextMenu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    contextMenu.style.left = `${x - rect.width}px`;
  }
  if (rect.bottom > window.innerHeight) {
    contextMenu.style.top = `${y - rect.height}px`;
  }
}

function hideContextMenu() {
  if (contextMenu) {
    contextMenu.style.display = 'none';
    contextMenu.innerHTML = '';
  }
}

async function handleNoteDelete(notePath: string) {
  const state = getState();
  const note = state.notes[notePath];

  if (!note) return;

  const confirmed = await ask(`Are you sure you want to delete "${note.title}"?`, {
    title: 'Delete Note',
    kind: 'warning',
  });

  if (confirmed) {
    deleteNote(notePath);
  }
}

async function handleFolderDelete(folderPath: string) {
  const state = getState();
  const folder = state.folders[folderPath];

  if (!folder) return;

  const notesInFolder = Object.values(state.notes).filter(n => n.folderPath === folderPath);
  const subfoldersInFolder = Object.values(state.folders).filter(f => f.parentPath === folderPath);

  let message = `Are you sure you want to delete the folder "${folder.name}"?`;

  if (notesInFolder.length > 0 || subfoldersInFolder.length > 0) {
    const parts = [];
    if (notesInFolder.length > 0) {
      parts.push(`${notesInFolder.length} note${notesInFolder.length > 1 ? 's' : ''}`);
    }
    if (subfoldersInFolder.length > 0) {
      parts.push(`${subfoldersInFolder.length} subfolder${subfoldersInFolder.length > 1 ? 's' : ''}`);
    }
    message += `\n\nThis folder contains ${parts.join(' and ')}. All notes will be moved to the root.`;
  }

  const confirmed = await ask(message, {
    title: 'Delete Folder',
    kind: 'warning',
  });

  if (confirmed) {
    deleteNoteFolder(folderPath);
  }
}

export function handleContextMenu(e: MouseEvent): void {
  const target = e.target as HTMLElement;

  const noteItem = target.closest('.file-nav__item') as HTMLElement;
  if (noteItem) {
    e.preventDefault();
    const notePath = noteItem.getAttribute('data-note-path');
    if (notePath) {
      showContextMenu(e.clientX, e.clientY, [
        {
          label: 'Delete',
          action: () => handleNoteDelete(notePath)
        }
      ]);
    }
    return;
  }

  const folderHeader = target.closest('.file-nav__folder-header') as HTMLElement;
  if (folderHeader) {
    e.preventDefault();
    const folderPath = folderHeader.getAttribute('data-folder-path');
    if (folderPath) {
      showContextMenu(e.clientX, e.clientY, [
        {
          label: 'Rename',
          action: () => handleFolderRename(folderPath)
        },
        {
          label: 'Delete',
          action: () => handleFolderDelete(folderPath)
        }
      ]);
    }
    return;
  }
}

export function setupContextMenuCleanup(): void {
  document.addEventListener('click', hideContextMenu);
  document.addEventListener('contextmenu', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.file-nav')) {
      hideContextMenu();
    }
  });
}

export function cleanupContextMenu(): void {
  hideContextMenu();
  if (contextMenu && contextMenu.parentNode) {
    contextMenu.parentNode.removeChild(contextMenu);
    contextMenu = null;
  }
  document.removeEventListener('click', hideContextMenu);
}
