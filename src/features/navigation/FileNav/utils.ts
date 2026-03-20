import { Note, Folder } from '../../../core';
import { CONSTANTS, DATE_FORMAT_OPTIONS } from './constants';

export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    if (b.modifiedAt !== a.modifiedAt) {
      return b.modifiedAt - a.modifiedAt;
    }
    return b.createdAt - a.createdAt;
  });
}

export function sortFolders(folders: Folder[]): Folder[] {
  return [...folders].sort((a, b) => a.position - b.position);
}

export function truncateTitle(title: string, maxLength: number = CONSTANTS.TITLE_MAX_LENGTH): string {
  if (title.length <= maxLength) {
    return title;
  }
  return title.substring(0, maxLength) + '...';
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', DATE_FORMAT_OPTIONS);
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function countNotesInFolder(folderPath: string, notes: Record<string, Note>, folders: Record<string, Folder>): number {
  let count = 0;

  Object.values(notes).forEach(note => {
    if (note.folderPath === folderPath) {
      count++;
    }
  });

  Object.values(folders).forEach(folder => {
    if (folder.parentPath === folderPath) {
      count += countNotesInFolder(folder.path, notes, folders);
    }
  });

  return count;
}
