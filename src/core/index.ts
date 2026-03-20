export {
  setState,
  getState,
  subscribe,
  resetState,
  createNote,
  deleteNote,
  updateNoteContent,
  switchToNote,
  getCurrentNoteContent,
  moveNoteToFolder,
  createFolder as createNoteFolder,
  updateFolder as updateNoteFolder,
  renameFolder as renameNoteFolder,
  moveFolderToParent,
  deleteFolder as deleteNoteFolder,
  toggleFolderExpanded,
  reorderNote,
  reorderFolder,
  increaseFontSize,
  decreaseFontSize,
  resetFontSize
} from './state';
export type { AppState, Note, Folder } from './state';

export {
  createFile,
  updateFile,
  removeFile,
  createFolder,
  updateFolder,
  removeFolder,
  moveFolderPosition,
  getFile,
  getFolder,
  getFilesInFolder,
  getFoldersInFolder,
  getAllFiles,
  getAllFolders,
  searchFiles,
  getFileSystem,
  resetFileSystem,
  importFiles,
  exportToJSON,
  importFromJSON
} from './files';
export type { FileNode, FolderNode, FileSystem, ImportedFile } from './files';

export { checkAndRunFirstTimeSetup } from './firstRun';

export { searchNotes } from './search';
export type { SearchResult, SearchMatch } from './search';
