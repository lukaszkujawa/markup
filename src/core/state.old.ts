export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  modifiedAt: number;
  folderId: string | null;
  position: number;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  position: number;
  createdAt: number;
  isExpanded: boolean;
}

export interface AppState {
  currentFile: string | null;
  files: string[];
  currentNoteId: string | null;
  notes: Record<string, Note>;
  folders: Record<string, Folder>;
  editorScrollPercent: number;
  editorLine: number;
  editorColumn: number;
  showFileNav: boolean;
  showEditor: boolean;
  showPreview: boolean;
  searchMode: boolean;
}

const DEFAULT_NOTE_ID = 'default';
const DEFAULT_NOTE_CONTENT = `# Welcome to Markup

A clean, modern **markdown editor** with real-time preview.

## Features

- 📝 **Markdown** syntax highlighting
- 💻 **Code blocks** with syntax highlighting (JavaScript, TypeScript)
- 📊 **D2 diagrams** - text to diagram rendering
- 🎨 Clean and minimal interface
- 💾 Auto-save to localStorage

## Code Example

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return true;
}

greet("World");
\`\`\`

## D2 Diagram Example

Create beautiful diagrams with D2 syntax:

\`\`\`d2
# System Architecture
direction: right

users: Users {
  shape: person
  style.multiple: true
}

users -> web: HTTPS requests

web: Web Server {
  style.fill: "#d4e8ff"
}

web -> api: REST API
web -> cache: Query cache

api: API Gateway {
  style.fill: "#ffe8d4"
}

api -> db: SQL queries
api -> queue: Async jobs

db: Database {
  shape: cylinder
  style.fill: "#d4ffe8"
}

cache: Redis Cache {
  shape: cylinder
  style.fill: "#ffd4e8"
}

queue: Job Queue {
  shape: queue
}
\`\`\`

## Try it yourself!

Start typing below or edit this document. Your changes are saved automatically.
`;

const DEFAULT_STATE: AppState = {
  currentFile: null,
  files: [],
  currentNoteId: DEFAULT_NOTE_ID,
  notes: {
    [DEFAULT_NOTE_ID]: {
      id: DEFAULT_NOTE_ID,
      title: 'Welcome',
      content: DEFAULT_NOTE_CONTENT,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      folderId: null,
      position: 0
    }
  },
  folders: {},
  editorScrollPercent: 0,
  editorLine: 1,
  editorColumn: 1,
  showFileNav: true,
  showEditor: true,
  showPreview: true,
  searchMode: false
};

const STORAGE_KEY = 'markup_app_state';

function loadStateFromStorage(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);

      // Migration: if old format with editorContent, convert to new format
      if ('editorContent' in parsed && !('notes' in parsed)) {
        const migratedNote: Note = {
          id: DEFAULT_NOTE_ID,
          title: 'Welcome',
          content: parsed.editorContent || DEFAULT_NOTE_CONTENT,
          createdAt: Date.now(),
          modifiedAt: Date.now(),
          folderId: null,
          position: 0
        };
        return {
          ...DEFAULT_STATE,
          currentNoteId: DEFAULT_NOTE_ID,
          notes: { [DEFAULT_NOTE_ID]: migratedNote },
          currentFile: parsed.currentFile || null,
          files: parsed.files || []
        };
      }

      // Migration: if notes exist but don't have folderId or position, add them
      if ('notes' in parsed) {
        const migratedNotes: Record<string, Note> = {};
        const notesByFolder: Record<string, any[]> = {};

        Object.entries(parsed.notes as Record<string, any>).forEach(([id, note]) => {
          const folderId = note.folderId ?? null;
          const folderKey = folderId ?? 'root';

          if (!notesByFolder[folderKey]) {
            notesByFolder[folderKey] = [];
          }
          notesByFolder[folderKey].push({ id, note });
        });

        Object.values(notesByFolder).forEach(notesInFolder => {
          notesInFolder.forEach((item, index) => {
            migratedNotes[item.id] = {
              ...item.note,
              folderId: item.note.folderId ?? null,
              position: item.note.position ?? index
            };
          });
        });

        parsed.notes = migratedNotes;
      }

      // Ensure folders exist and migrate position field
      if (!('folders' in parsed)) {
        parsed.folders = {};
      } else {
        const migratedFolders: Record<string, Folder> = {};
        const foldersByParent: Record<string, any[]> = {};

        Object.entries(parsed.folders as Record<string, any>).forEach(([id, folder]) => {
          const parentId = folder.parentId ?? null;
          const parentKey = parentId ?? 'root';

          if (!foldersByParent[parentKey]) {
            foldersByParent[parentKey] = [];
          }
          foldersByParent[parentKey].push({ id, folder });
        });

        Object.values(foldersByParent).forEach(foldersInParent => {
          foldersInParent.forEach((item, index) => {
            migratedFolders[item.id] = {
              ...item.folder,
              position: item.folder.position ?? index
            };
          });
        });

        parsed.folders = migratedFolders;
      }

      if (parsed.showFileNav === undefined) {
        parsed.showFileNav = true;
      }
      if (parsed.showEditor === undefined) {
        parsed.showEditor = true;
      }
      if (parsed.showPreview === undefined) {
        parsed.showPreview = true;
      }
      if (parsed.editorLine === undefined) {
        parsed.editorLine = 1;
      }
      if (parsed.editorColumn === undefined) {
        parsed.editorColumn = 1;
      }

      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
  }
  return { ...DEFAULT_STATE };
}

function saveStateToStorage(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);

    if (err instanceof DOMException && (
        err.name === 'QuotaExceededError' ||
        err.code === 22 ||
        err.code === 1014)) {
      alert('Storage quota exceeded! Your changes may not be saved. Please export your notes or delete old content.');
    } else {
      alert('Failed to save your changes. Please try exporting your data as backup.');
    }

    throw err;
  }
}

export const state: AppState = loadStateFromStorage();

type StateChangeListener = (updates: Partial<AppState>) => void;
const listeners: StateChangeListener[] = [];

function validateStateUpdate(updates: Partial<AppState>): void {
  if (updates.currentNoteId !== undefined && updates.currentNoteId !== null && typeof updates.currentNoteId !== 'string') {
    throw new Error('Invalid currentNoteId: must be a string or null');
  }
  if (updates.notes !== undefined && typeof updates.notes !== 'object') {
    throw new Error('Invalid notes: must be an object');
  }
  if (updates.folders !== undefined && typeof updates.folders !== 'object') {
    throw new Error('Invalid folders: must be an object');
  }
  if (updates.currentFile !== undefined && updates.currentFile !== null && typeof updates.currentFile !== 'string') {
    throw new Error('Invalid currentFile: must be a string or null');
  }
  if (updates.files !== undefined && !Array.isArray(updates.files)) {
    throw new Error('Invalid files: must be an array');
  }
  if (updates.editorScrollPercent !== undefined && (typeof updates.editorScrollPercent !== 'number' || updates.editorScrollPercent < 0 || updates.editorScrollPercent > 1)) {
    throw new Error('Invalid editorScrollPercent: must be a number between 0 and 1');
  }
  if (updates.editorLine !== undefined && (typeof updates.editorLine !== 'number' || updates.editorLine < 1)) {
    throw new Error('Invalid editorLine: must be a number >= 1');
  }
  if (updates.editorColumn !== undefined && (typeof updates.editorColumn !== 'number' || updates.editorColumn < 1)) {
    throw new Error('Invalid editorColumn: must be a number >= 1');
  }
  if (updates.showFileNav !== undefined && typeof updates.showFileNav !== 'boolean') {
    throw new Error('Invalid showFileNav: must be a boolean');
  }
  if (updates.showEditor !== undefined && typeof updates.showEditor !== 'boolean') {
    throw new Error('Invalid showEditor: must be a boolean');
  }
  if (updates.showPreview !== undefined && typeof updates.showPreview !== 'boolean') {
    throw new Error('Invalid showPreview: must be a boolean');
  }
}

export function setState(updates: Partial<AppState>): void {
  validateStateUpdate(updates);

  const backup = { ...state };

  try {
    Object.assign(state, updates);
    saveStateToStorage(state);
    listeners.forEach(listener => listener(updates));
  } catch (err) {
    Object.assign(state, backup);
    throw err;
  }
}

export function getState(): AppState {
  return state;
}

export function subscribe(listener: StateChangeListener): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

export function resetState(): void {
  Object.assign(state, DEFAULT_STATE);
  saveStateToStorage(state);
  listeners.forEach(listener => listener(state));
}

// Note management functions
export function createNote(title?: string, folderId: string | null = null): Note {
  const id = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const siblings = Object.values(state.notes).filter(n => n.folderId === folderId);
  const maxPosition = siblings.length > 0 ? Math.max(...siblings.map(n => n.position)) : -1;

  const note: Note = {
    id,
    title: title || 'Untitled Note',
    content: '',
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    folderId,
    position: maxPosition + 1
  };

  setState({
    notes: { ...state.notes, [id]: note },
    currentNoteId: id
  });

  return note;
}

export function deleteNote(noteId: string): void {
  if (!state.notes[noteId]) {
    throw new Error(`Note with id ${noteId} does not exist`);
  }

  const { [noteId]: deleted, ...remainingNotes } = state.notes;
  const noteIds = Object.keys(remainingNotes);

  // If deleting current note, switch to another one
  const newCurrentNoteId = state.currentNoteId === noteId
    ? (noteIds.length > 0 ? noteIds[0] : null)
    : state.currentNoteId;

  setState({
    notes: remainingNotes,
    currentNoteId: newCurrentNoteId
  });
}

function deriveTitleFromContent(content: string): string {
  const firstLine = content.split('\n')[0].trim();

  if (!firstLine) {
    return 'Untitled Note';
  }

  let title = firstLine.replace(/^#+\s*/, '');

  if (!title) {
    return 'Untitled Note';
  }

  if (title.length > 100) {
    title = title.substring(0, 100);
  }

  return title;
}

export function updateNoteContent(noteId: string, content: string): void {
  const note = state.notes[noteId];
  if (!note) {
    throw new Error(`Note with id ${noteId} does not exist`);
  }

  const derivedTitle = deriveTitleFromContent(content);

  const updatedNote: Note = {
    ...note,
    title: derivedTitle,
    content,
    modifiedAt: Date.now()
  };

  setState({
    notes: { ...state.notes, [noteId]: updatedNote }
  });
}

export function switchToNote(noteId: string): void {
  if (!state.notes[noteId]) {
    throw new Error(`Note with id ${noteId} does not exist`);
  }

  setState({ currentNoteId: noteId });
}

export function getCurrentNoteContent(): string {
  if (!state.currentNoteId) {
    return '';
  }

  const note = state.notes[state.currentNoteId];
  return note ? note.content : '';
}

export function moveNoteToFolder(noteId: string, folderId: string | null): void {
  const note = state.notes[noteId];
  if (!note) {
    throw new Error(`Note with id ${noteId} does not exist`);
  }

  if (folderId !== null && !state.folders[folderId]) {
    throw new Error(`Folder with id ${folderId} does not exist`);
  }

  const updatedNote: Note = {
    ...note,
    folderId
  };

  setState({
    notes: { ...state.notes, [noteId]: updatedNote }
  });
}

export function createFolder(name: string, parentId: string | null = null): Folder {
  const id = `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const siblings = Object.values(state.folders).filter(f => f.parentId === parentId);
  const maxPosition = siblings.length > 0 ? Math.max(...siblings.map(f => f.position)) : -1;

  const folder: Folder = {
    id,
    name,
    parentId,
    position: maxPosition + 1,
    createdAt: Date.now(),
    isExpanded: true
  };

  setState({
    folders: { ...state.folders, [id]: folder }
  });

  return folder;
}

export function updateFolder(folderId: string, updates: Partial<Omit<Folder, 'id' | 'createdAt'>>): void {
  const folder = state.folders[folderId];
  if (!folder) {
    throw new Error(`Folder with id ${folderId} does not exist`);
  }

  const updatedFolder: Folder = {
    ...folder,
    ...updates
  };

  setState({
    folders: { ...state.folders, [folderId]: updatedFolder }
  });
}

export function deleteFolder(folderId: string): void {
  if (!state.folders[folderId]) {
    throw new Error(`Folder with id ${folderId} does not exist`);
  }

  const foldersToDelete = new Set<string>([folderId]);
  const queue = [folderId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    Object.values(state.folders).forEach(folder => {
      if (folder.parentId === currentId && !foldersToDelete.has(folder.id)) {
        foldersToDelete.add(folder.id);
        queue.push(folder.id);
      }
    });
  }

  const remainingFolders: Record<string, Folder> = {};
  Object.entries(state.folders).forEach(([id, folder]) => {
    if (!foldersToDelete.has(id)) {
      remainingFolders[id] = folder;
    }
  });

  const updatedNotes = { ...state.notes };
  Object.values(state.notes).forEach(note => {
    if (note.folderId && foldersToDelete.has(note.folderId)) {
      updatedNotes[note.id] = { ...note, folderId: null };
    }
  });

  setState({
    folders: remainingFolders,
    notes: updatedNotes
  });
}

export function toggleFolderExpanded(folderId: string): void {
  const folder = state.folders[folderId];
  if (!folder) {
    throw new Error(`Folder with id ${folderId} does not exist`);
  }

  updateFolder(folderId, { isExpanded: !folder.isExpanded });
}

export function reorderNote(noteId: string, newPosition: number, newFolderId: string | null = null): void {
  const note = state.notes[noteId];
  if (!note) {
    throw new Error(`Note with id ${noteId} does not exist`);
  }

  const targetFolderId = newFolderId !== undefined ? newFolderId : note.folderId;

  const siblings = Object.values(state.notes)
    .filter(n => n.folderId === targetFolderId && n.id !== noteId)
    .sort((a, b) => a.position - b.position);

  const updatedNotes = { ...state.notes };

  siblings.forEach((sibling, index) => {
    const adjustedPosition = index >= newPosition ? index + 1 : index;
    if (sibling.position !== adjustedPosition) {
      updatedNotes[sibling.id] = { ...sibling, position: adjustedPosition };
    }
  });

  updatedNotes[noteId] = {
    ...note,
    position: newPosition,
    folderId: targetFolderId
  };

  setState({ notes: updatedNotes });
}

export function reorderFolder(folderId: string, newPosition: number, newParentId: string | null = null): void {
  const folder = state.folders[folderId];
  if (!folder) {
    throw new Error(`Folder with id ${folderId} does not exist`);
  }

  if (newParentId !== null && !state.folders[newParentId]) {
    throw new Error(`Parent folder with id ${newParentId} does not exist`);
  }

  const targetParentId = newParentId !== undefined ? newParentId : folder.parentId;

  const siblings = Object.values(state.folders)
    .filter(f => f.parentId === targetParentId && f.id !== folderId)
    .sort((a, b) => a.position - b.position);

  const updatedFolders = { ...state.folders };

  siblings.forEach((sibling, index) => {
    const adjustedPosition = index >= newPosition ? index + 1 : index;
    if (sibling.position !== adjustedPosition) {
      updatedFolders[sibling.id] = { ...sibling, position: adjustedPosition };
    }
  });

  updatedFolders[folderId] = {
    ...folder,
    position: newPosition,
    parentId: targetParentId
  };

  setState({ folders: updatedFolders });
}
