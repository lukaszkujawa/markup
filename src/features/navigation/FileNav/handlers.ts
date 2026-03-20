import {
  getState,
  switchToNote,
  renameNoteFolder,
  toggleFolderExpanded
} from '../../../core';

export let editingFolderPath: string | null = null;

export function handleSelectNote(notePath: string): void {
  switchToNote(notePath);
}

export function handleFolderToggle(folderPath: string): void {
  toggleFolderExpanded(folderPath);
}

export function handleFolderRename(folderPath: string): void {
  const state = getState();
  const folder = state.folders[folderPath];

  if (!folder) return;

  const folderNameElement = document.querySelector(
    `.file-nav__folder-name[data-folder-path="${folderPath}"]`
  ) as HTMLElement;

  if (!folderNameElement) return;

  editingFolderPath = folderPath;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'file-nav__folder-input';
  input.value = folder.name;

  folderNameElement.style.display = 'none';
  folderNameElement.parentElement?.insertBefore(input, folderNameElement);
  input.focus();
  input.select();

  const finishEditing = async () => {
    const newName = input.value.trim();
    if (newName && newName !== folder.name) {
      try {
        await renameNoteFolder(folderPath, newName);
      } catch (err) {
        console.error('Error renaming folder:', err);
        alert(`Failed to rename folder: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
    input.remove();
    folderNameElement.style.display = '';
    editingFolderPath = null;
  };

  input.addEventListener('blur', finishEditing);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      finishEditing();
    } else if (e.key === 'Escape') {
      input.value = folder.name;
      finishEditing();
    }
  });
}

export function resetEditingState(): void {
  editingFolderPath = null;
}
