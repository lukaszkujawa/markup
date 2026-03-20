import {
  initializeStorage,
  listNotes,
  readNote,
  writeNote,
  deleteNote as fsDeleteNote,
  createFolder as fsCreateFolder,
  deleteFolder as fsDeleteFolder,
  readMetadata,
  writeMetadata,
  moveNote,
  moveFolder,
  sanitizeFileName,
  getFolderPath,
  getFileName,
  type AppMetadata,
} from './fs-storage';

export interface Note {
  path: string;
  title: string;
  content: string;
  createdAt: number;
  modifiedAt: number;
  folderPath: string | null;
  position: number;
}

export interface Folder {
  path: string;
  name: string;
  parentPath: string | null;
  position: number;
  createdAt: number;
  isExpanded: boolean;
}

export interface AppState {
  currentFile: string | null;
  files: string[];
  currentNotePath: string | null;
  notes: Record<string, Note>;
  folders: Record<string, Folder>;
  editorScrollPercent: number;
  editorLine: number;
  editorColumn: number;
  showFileNav: boolean;
  showEditor: boolean;
  showPreview: boolean;
  searchMode: boolean;
  fontSize: number;
}

const DEFAULT_NOTE_CONTENT = `# Welcome to Markup

A clean, modern **markdown editor** with real-time preview.

## Features

- 📝 **Markdown** syntax highlighting
- 💻 **Code blocks** with syntax highlighting (JavaScript, TypeScript)
- 📊 **D2 diagrams** - text to diagram rendering
- 🎨 Clean and minimal interface
- 💾 Auto-save to filesystem

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
  currentNotePath: null,
  notes: {},
  folders: {},
  editorScrollPercent: 0,
  editorLine: 1,
  editorColumn: 1,
  showFileNav: true,
  showEditor: true,
  showPreview: true,
  searchMode: false,
  fontSize: 14
};

let isInitialized = false;

interface OldNote {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  modifiedAt: number;
  folderId: string | null;
  position: number;
}

interface OldFolder {
  id: string;
  name: string;
  parentId: string | null;
  position: number;
  createdAt: number;
  isExpanded: boolean;
}

interface OldAppState {
  currentNoteId: string | null;
  notes: Record<string, OldNote>;
  folders: Record<string, OldFolder>;
  editorScrollPercent?: number;
  editorLine?: number;
  editorColumn?: number;
  showFileNav?: boolean;
  showEditor?: boolean;
  showPreview?: boolean;
}

async function migrateFromLocalStorage(): Promise<void> {
  try {
    const stored = localStorage.getItem('markup_app_state');
    if (!stored) {
      return;
    }

    const oldState: OldAppState = JSON.parse(stored);

    if (!oldState.notes || Object.keys(oldState.notes).length === 0) {
      return;
    }

    console.log('Migrating from localStorage to filesystem...');

    const folderIdToPath = new Map<string, string>();

    const sortedFolders = Object.values(oldState.folders || {})
      .sort((a, b) => {
        const depthA = getDepth(a.id, oldState.folders || {});
        const depthB = getDepth(b.id, oldState.folders || {});
        return depthA - depthB;
      });

    for (const folder of sortedFolders) {
      const parentPath = folder.parentId ? folderIdToPath.get(folder.parentId) || null : null;
      const folderPath = parentPath ? `${parentPath}/${folder.name}` : folder.name;

      await fsCreateFolder(folderPath);
      folderIdToPath.set(folder.id, folderPath);
    }

    const metadata = await readMetadata();

    for (const note of Object.values(oldState.notes)) {
      const folderPath = note.folderId ? folderIdToPath.get(note.folderId) || null : null;
      const fileName = sanitizeFileName(note.title) + '.md';
      const notePath = folderPath ? `${folderPath}/${fileName}` : fileName;

      await writeNote(notePath, note.content);

      metadata.notes[notePath] = {
        position: note.position,
        created_at: note.createdAt,
        modified_at: note.modifiedAt
      };
    }

    for (const folder of Object.values(oldState.folders || {})) {
      const folderPath = folderIdToPath.get(folder.id);
      if (folderPath) {
        metadata.folders[folderPath] = {
          position: folder.position,
          is_expanded: folder.isExpanded,
          created_at: folder.createdAt
        };
      }
    }

    if (oldState.currentNoteId) {
      const currentNote = oldState.notes[oldState.currentNoteId];
      if (currentNote) {
        const folderPath = currentNote.folderId ? folderIdToPath.get(currentNote.folderId) || null : null;
        const fileName = sanitizeFileName(currentNote.title) + '.md';
        metadata.current_note_path = folderPath ? `${folderPath}/${fileName}` : fileName;
      }
    }

    metadata.editor_scroll_percent = oldState.editorScrollPercent ?? 0;
    metadata.editor_line = oldState.editorLine ?? 1;
    metadata.editor_column = oldState.editorColumn ?? 1;
    metadata.show_file_nav = oldState.showFileNav ?? true;
    metadata.show_editor = oldState.showEditor ?? true;
    metadata.show_preview = oldState.showPreview ?? true;

    await writeMetadata(metadata);

    localStorage.removeItem('markup_app_state');
    localStorage.removeItem('markup_filesystem');

    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Failed to migrate from localStorage:', err);
  }
}

function getDepth(folderId: string, folders: Record<string, OldFolder>): number {
  let depth = 0;
  let currentId: string | null = folderId;

  while (currentId) {
    const folder: OldFolder | undefined = folders[currentId];
    if (!folder) break;
    depth++;
    currentId = folder.parentId;
  }

  return depth;
}

async function ensureDefaultNote(): Promise<void> {
  const entries = await listNotes();

  if (entries.length === 0) {
    await writeNote('Welcome.md', DEFAULT_NOTE_CONTENT);

    const metadata = await readMetadata();
    metadata.current_note_path = 'Welcome.md';
    metadata.notes['Welcome.md'] = {
      position: 0,
      created_at: Date.now(),
      modified_at: Date.now()
    };
    await writeMetadata(metadata);
  }
}

async function loadStateFromFileSystem(): Promise<AppState> {
  try {
    await initializeStorage();
    await ensureDefaultNote();

    const [entries, metadata] = await Promise.all([
      listNotes(),
      readMetadata()
    ]);

    const notes: Record<string, Note> = {};
    const folders: Record<string, Folder> = {};

    for (const entry of entries) {
      if (entry.is_directory) {
        const folderMeta = metadata.folders[entry.path];
        const parentPath = getFolderPath(entry.path);

        folders[entry.path] = {
          path: entry.path,
          name: entry.name,
          parentPath,
          position: folderMeta?.position ?? 0,
          createdAt: folderMeta?.created_at ?? Date.now(),
          isExpanded: folderMeta?.is_expanded ?? true
        };
      } else {
        const noteMeta = metadata.notes[entry.path];
        const folderPath = getFolderPath(entry.path);

        const content = await readNote(entry.path);
        const title = deriveTitleFromContent(content);

        notes[entry.path] = {
          path: entry.path,
          title,
          content,
          createdAt: noteMeta?.created_at ?? entry.modified_at ?? Date.now(),
          modifiedAt: noteMeta?.modified_at ?? entry.modified_at ?? Date.now(),
          folderPath,
          position: noteMeta?.position ?? 0
        };
      }
    }

    return {
      ...DEFAULT_STATE,
      currentNotePath: metadata.current_note_path,
      notes,
      folders,
      editorScrollPercent: metadata.editor_scroll_percent ?? 0,
      editorLine: metadata.editor_line ?? 1,
      editorColumn: metadata.editor_column ?? 1,
      showFileNav: metadata.show_file_nav ?? true,
      showEditor: metadata.show_editor ?? true,
      showPreview: metadata.show_preview ?? true,
      fontSize: metadata.font_size ?? 14
    };
  } catch (err) {
    console.error('Failed to load state from filesystem:', err);
    return { ...DEFAULT_STATE };
  }
}

export const state: AppState = { ...DEFAULT_STATE };

export async function initializeState(): Promise<void> {
  if (isInitialized) return;

  await initializeStorage();
  await migrateFromLocalStorage();

  const loadedState = await loadStateFromFileSystem();
  Object.assign(state, loadedState);
  isInitialized = true;

  listeners.forEach(listener => listener(state));
}

async function saveMetadataToFileSystem(): Promise<void> {
  const metadata: AppMetadata = {
    current_note_path: state.currentNotePath,
    editor_scroll_percent: state.editorScrollPercent,
    editor_line: state.editorLine,
    editor_column: state.editorColumn,
    show_file_nav: state.showFileNav,
    show_editor: state.showEditor,
    show_preview: state.showPreview,
    font_size: state.fontSize,
    folders: {},
    notes: {}
  };

  Object.values(state.folders).forEach(folder => {
    metadata.folders[folder.path] = {
      position: folder.position,
      is_expanded: folder.isExpanded,
      created_at: folder.createdAt
    };
  });

  Object.values(state.notes).forEach(note => {
    metadata.notes[note.path] = {
      position: note.position,
      created_at: note.createdAt,
      modified_at: note.modifiedAt
    };
  });

  await writeMetadata(metadata);
}

type StateChangeListener = (updates: Partial<AppState>) => void;
const listeners: StateChangeListener[] = [];

function validateStateUpdate(updates: Partial<AppState>): void {
  if (updates.currentNotePath !== undefined && updates.currentNotePath !== null && typeof updates.currentNotePath !== 'string') {
    throw new Error('Invalid currentNotePath: must be a string or null');
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

    saveMetadataToFileSystem().catch(err => {
      console.error('Failed to save metadata:', err);
      Object.assign(state, backup);
    });

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

export async function resetState(): Promise<void> {
  Object.assign(state, DEFAULT_STATE);
  await saveMetadataToFileSystem();
  listeners.forEach(listener => listener(state));
}

export async function createNote(title?: string, folderPath: string | null = null): Promise<Note> {
  const noteTitle = title || 'Untitled Note';
  const fileName = sanitizeFileName(noteTitle) + '.md';
  const relativePath = folderPath ? `${folderPath}/${fileName}` : fileName;

  const siblings = Object.values(state.notes).filter(n => n.folderPath === folderPath);
  const maxPosition = siblings.length > 0 ? Math.max(...siblings.map(n => n.position)) : -1;

  const note: Note = {
    path: relativePath,
    title: noteTitle,
    content: '',
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    folderPath,
    position: maxPosition + 1
  };

  await writeNote(relativePath, note.content);

  setState({
    notes: { ...state.notes, [relativePath]: note },
    currentNotePath: relativePath
  });

  return note;
}

export async function deleteNote(notePath: string): Promise<void> {
  if (!state.notes[notePath]) {
    throw new Error(`Note with path ${notePath} does not exist`);
  }

  await fsDeleteNote(notePath);

  const { [notePath]: deleted, ...remainingNotes } = state.notes;
  const notePaths = Object.keys(remainingNotes);

  const newCurrentNotePath = state.currentNotePath === notePath
    ? (notePaths.length > 0 ? notePaths[0] : null)
    : state.currentNotePath;

  setState({
    notes: remainingNotes,
    currentNotePath: newCurrentNotePath
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

export async function updateNoteContent(notePath: string, content: string): Promise<void> {
  const note = state.notes[notePath];
  if (!note) {
    throw new Error(`Note with path ${notePath} does not exist`);
  }

  const derivedTitle = deriveTitleFromContent(content);
  const newFileName = sanitizeFileName(derivedTitle) + '.md';
  const folderPath = note.folderPath;
  const newPath = folderPath ? `${folderPath}/${newFileName}` : newFileName;

  const updatedNote: Note = {
    ...note,
    title: derivedTitle,
    content,
    modifiedAt: Date.now()
  };

  await writeNote(note.path, content);

  if (newPath !== note.path && !state.notes[newPath]) {
    await moveNote(note.path, newPath);

    const { [note.path]: old, ...remainingNotes } = state.notes;
    updatedNote.path = newPath;

    setState({
      notes: { ...remainingNotes, [newPath]: updatedNote },
      currentNotePath: state.currentNotePath === note.path ? newPath : state.currentNotePath
    });
  } else {
    setState({
      notes: { ...state.notes, [note.path]: updatedNote }
    });
  }
}

export function switchToNote(notePath: string): void {
  if (!state.notes[notePath]) {
    throw new Error(`Note with path ${notePath} does not exist`);
  }

  setState({ currentNotePath: notePath });
}

export function getCurrentNoteContent(): string {
  if (!state.currentNotePath) {
    return '';
  }

  const note = state.notes[state.currentNotePath];
  return note ? note.content : '';
}

export async function moveNoteToFolder(notePath: string, folderPath: string | null): Promise<void> {
  const note = state.notes[notePath];
  if (!note) {
    throw new Error(`Note with path ${notePath} does not exist`);
  }

  if (folderPath !== null && !state.folders[folderPath]) {
    throw new Error(`Folder with path ${folderPath} does not exist`);
  }

  const fileName = getFileName(notePath);
  const newPath = folderPath ? `${folderPath}/${fileName}` : fileName;

  if (newPath !== notePath) {
    await moveNote(notePath, newPath);

    const { [notePath]: old, ...remainingNotes } = state.notes;
    const updatedNote: Note = {
      ...note,
      path: newPath,
      folderPath
    };

    setState({
      notes: { ...remainingNotes, [newPath]: updatedNote },
      currentNotePath: state.currentNotePath === notePath ? newPath : state.currentNotePath
    });
  } else {
    const updatedNote: Note = {
      ...note,
      folderPath
    };

    setState({
      notes: { ...state.notes, [notePath]: updatedNote }
    });
  }
}

export async function createFolder(name: string, parentPath: string | null = null): Promise<Folder> {
  const folderName = sanitizeFileName(name);
  const relativePath = parentPath ? `${parentPath}/${folderName}` : folderName;

  const siblings = Object.values(state.folders).filter(f => f.parentPath === parentPath);
  const maxPosition = siblings.length > 0 ? Math.max(...siblings.map(f => f.position)) : -1;

  const folder: Folder = {
    path: relativePath,
    name: folderName,
    parentPath,
    position: maxPosition + 1,
    createdAt: Date.now(),
    isExpanded: true
  };

  await fsCreateFolder(relativePath);

  setState({
    folders: { ...state.folders, [relativePath]: folder }
  });

  return folder;
}

export function updateFolder(folderPath: string, updates: Partial<Omit<Folder, 'path' | 'createdAt' | 'name'>>): void {
  const folder = state.folders[folderPath];
  if (!folder) {
    throw new Error(`Folder with path ${folderPath} does not exist`);
  }

  const updatedFolder: Folder = {
    ...folder,
    ...updates
  };

  setState({
    folders: { ...state.folders, [folderPath]: updatedFolder }
  });
}

export async function renameFolder(folderPath: string, newName: string): Promise<void> {
  const folder = state.folders[folderPath];
  if (!folder) {
    throw new Error(`Folder with path ${folderPath} does not exist`);
  }

  const sanitizedName = sanitizeFileName(newName);
  if (sanitizedName === folder.name) {
    return;
  }

  const newPath = folder.parentPath ? `${folder.parentPath}/${sanitizedName}` : sanitizedName;

  if (state.folders[newPath]) {
    throw new Error(`Folder with path ${newPath} already exists`);
  }

  await moveFolder(folderPath, newPath);

  const updatedFolders: Record<string, Folder> = {};
  const updatedNotes: Record<string, Note> = {};

  Object.entries(state.folders).forEach(([path, f]) => {
    if (path === folderPath) {
      updatedFolders[newPath] = {
        ...f,
        path: newPath,
        name: sanitizedName
      };
    } else if (path.startsWith(folderPath + '/')) {
      const relativePath = path.substring(folderPath.length + 1);
      const updatedPath = `${newPath}/${relativePath}`;
      updatedFolders[updatedPath] = {
        ...f,
        path: updatedPath,
        parentPath: f.parentPath === folderPath ? newPath : f.parentPath?.replace(folderPath, newPath) || null
      };
    } else {
      updatedFolders[path] = f;
    }
  });

  Object.entries(state.notes).forEach(([path, note]) => {
    if (note.folderPath === folderPath) {
      const fileName = getFileName(path);
      const updatedPath = `${newPath}/${fileName}`;
      updatedNotes[updatedPath] = {
        ...note,
        path: updatedPath,
        folderPath: newPath
      };
    } else if (note.folderPath && note.folderPath.startsWith(folderPath + '/')) {
      const updatedFolderPath = note.folderPath.replace(folderPath, newPath);
      const fileName = getFileName(path);
      const updatedPath = `${updatedFolderPath}/${fileName}`;
      updatedNotes[updatedPath] = {
        ...note,
        path: updatedPath,
        folderPath: updatedFolderPath
      };
    } else {
      updatedNotes[path] = note;
    }
  });

  setState({
    folders: updatedFolders,
    notes: updatedNotes,
    currentNotePath: state.currentNotePath && state.notes[state.currentNotePath]?.folderPath?.startsWith(folderPath)
      ? updatedNotes[Object.keys(updatedNotes).find(p => state.notes[state.currentNotePath!] && updatedNotes[p] === state.notes[state.currentNotePath!]) || '']?.path || state.currentNotePath
      : state.currentNotePath
  });
}

export async function moveFolderToParent(folderPath: string, newParentPath: string | null): Promise<void> {
  const folder = state.folders[folderPath];
  if (!folder) {
    throw new Error(`Folder with path ${folderPath} does not exist`);
  }

  if (newParentPath !== null && !state.folders[newParentPath]) {
    throw new Error(`Parent folder with path ${newParentPath} does not exist`);
  }

  if (folder.parentPath === newParentPath) {
    return;
  }

  if (newParentPath && isDescendantFolder(newParentPath, folderPath)) {
    throw new Error('Cannot move folder into its own descendant');
  }

  const newPath = newParentPath ? `${newParentPath}/${folder.name}` : folder.name;

  if (state.folders[newPath]) {
    throw new Error(`Folder with path ${newPath} already exists`);
  }

  await moveFolder(folderPath, newPath);

  const updatedFolders: Record<string, Folder> = {};
  const updatedNotes: Record<string, Note> = {};

  Object.entries(state.folders).forEach(([path, f]) => {
    if (path === folderPath) {
      updatedFolders[newPath] = {
        ...f,
        path: newPath,
        parentPath: newParentPath
      };
    } else if (path.startsWith(folderPath + '/')) {
      const relativePath = path.substring(folderPath.length + 1);
      const updatedPath = `${newPath}/${relativePath}`;
      updatedFolders[updatedPath] = {
        ...f,
        path: updatedPath,
        parentPath: f.parentPath === folderPath ? newPath : f.parentPath?.replace(folderPath, newPath) || null
      };
    } else {
      updatedFolders[path] = f;
    }
  });

  Object.entries(state.notes).forEach(([path, note]) => {
    if (note.folderPath === folderPath) {
      const fileName = getFileName(path);
      const updatedPath = `${newPath}/${fileName}`;
      updatedNotes[updatedPath] = {
        ...note,
        path: updatedPath,
        folderPath: newPath
      };
    } else if (note.folderPath && note.folderPath.startsWith(folderPath + '/')) {
      const updatedFolderPath = note.folderPath.replace(folderPath, newPath);
      const fileName = getFileName(path);
      const updatedPath = `${updatedFolderPath}/${fileName}`;
      updatedNotes[updatedPath] = {
        ...note,
        path: updatedPath,
        folderPath: updatedFolderPath
      };
    } else {
      updatedNotes[path] = note;
    }
  });

  setState({
    folders: updatedFolders,
    notes: updatedNotes,
    currentNotePath: state.currentNotePath && state.notes[state.currentNotePath]?.folderPath?.startsWith(folderPath)
      ? updatedNotes[Object.keys(updatedNotes).find(p => state.notes[state.currentNotePath!] && updatedNotes[p] === state.notes[state.currentNotePath!]) || '']?.path || state.currentNotePath
      : state.currentNotePath
  });
}

function isDescendantFolder(folderPath: string, potentialAncestorPath: string): boolean {
  let currentPath: string | null = folderPath;
  const visited = new Set<string>();

  while (currentPath) {
    if (currentPath === potentialAncestorPath) {
      return true;
    }
    if (visited.has(currentPath)) {
      return false;
    }
    visited.add(currentPath);
    const folder: Folder | undefined = state.folders[currentPath];
    currentPath = folder?.parentPath ?? null;
  }

  return false;
}

export async function deleteFolder(folderPath: string): Promise<void> {
  if (!state.folders[folderPath]) {
    throw new Error(`Folder with path ${folderPath} does not exist`);
  }

  const foldersToDelete = new Set<string>([folderPath]);
  const queue = [folderPath];

  while (queue.length > 0) {
    const currentPath = queue.shift()!;

    Object.values(state.folders).forEach(folder => {
      if (folder.parentPath === currentPath && !foldersToDelete.has(folder.path)) {
        foldersToDelete.add(folder.path);
        queue.push(folder.path);
      }
    });
  }

  await fsDeleteFolder(folderPath);

  const remainingFolders: Record<string, Folder> = {};
  Object.entries(state.folders).forEach(([path, folder]) => {
    if (!foldersToDelete.has(path)) {
      remainingFolders[path] = folder;
    }
  });

  const updatedNotes = { ...state.notes };
  Object.values(state.notes).forEach(note => {
    if (note.folderPath && foldersToDelete.has(note.folderPath)) {
      updatedNotes[note.path] = { ...note, folderPath: null };
    }
  });

  setState({
    folders: remainingFolders,
    notes: updatedNotes
  });
}

export function toggleFolderExpanded(folderPath: string): void {
  const folder = state.folders[folderPath];
  if (!folder) {
    throw new Error(`Folder with path ${folderPath} does not exist`);
  }

  updateFolder(folderPath, { isExpanded: !folder.isExpanded });
}

export function reorderNote(notePath: string, newPosition: number, newFolderPath: string | null = null): void {
  const note = state.notes[notePath];
  if (!note) {
    throw new Error(`Note with path ${notePath} does not exist`);
  }

  const targetFolderPath = newFolderPath !== undefined ? newFolderPath : note.folderPath;

  const siblings = Object.values(state.notes)
    .filter(n => n.folderPath === targetFolderPath && n.path !== notePath)
    .sort((a, b) => a.position - b.position);

  const updatedNotes = { ...state.notes };

  siblings.forEach((sibling, index) => {
    const adjustedPosition = index >= newPosition ? index + 1 : index;
    if (sibling.position !== adjustedPosition) {
      updatedNotes[sibling.path] = { ...sibling, position: adjustedPosition };
    }
  });

  updatedNotes[notePath] = {
    ...note,
    position: newPosition,
    folderPath: targetFolderPath
  };

  setState({ notes: updatedNotes });
}

export function reorderFolder(folderPath: string, newPosition: number, newParentPath: string | null = null): void {
  const folder = state.folders[folderPath];
  if (!folder) {
    throw new Error(`Folder with path ${folderPath} does not exist`);
  }

  if (newParentPath !== null && !state.folders[newParentPath]) {
    throw new Error(`Parent folder with path ${newParentPath} does not exist`);
  }

  const targetParentPath = newParentPath !== undefined ? newParentPath : folder.parentPath;

  const siblings = Object.values(state.folders)
    .filter(f => f.parentPath === targetParentPath && f.path !== folderPath)
    .sort((a, b) => a.position - b.position);

  const updatedFolders = { ...state.folders };

  siblings.forEach((sibling, index) => {
    const adjustedPosition = index >= newPosition ? index + 1 : index;
    if (sibling.position !== adjustedPosition) {
      updatedFolders[sibling.path] = { ...sibling, position: adjustedPosition };
    }
  });

  updatedFolders[folderPath] = {
    ...folder,
    position: newPosition,
    parentPath: targetParentPath
  };

  setState({ folders: updatedFolders });
}

export function increaseFontSize(): void {
  const currentState = getState();
  const currentSize = currentState.fontSize || 14;
  const newSize = Math.min(currentSize + 2, 32);
  console.log(`Increase font: ${currentSize} -> ${newSize}`);
  if (newSize !== currentSize) {
    setState({ fontSize: newSize });
  } else {
    console.log('Already at maximum size (32)');
  }
}

export function decreaseFontSize(): void {
  const currentState = getState();
  const currentSize = currentState.fontSize || 14;
  const newSize = Math.max(currentSize - 2, 8);
  console.log(`Decrease font: ${currentSize} -> ${newSize}`);
  if (newSize !== currentSize) {
    setState({ fontSize: newSize });
  } else {
    console.log('Already at minimum size (8)');
  }
}

export function resetFontSize(): void {
  console.log('Reset font to 14');
  setState({ fontSize: 14 });
}
