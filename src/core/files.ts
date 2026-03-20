export interface FileNode {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  parentId: string | null;
}

export interface FolderNode {
  id: string;
  name: string;
  parentId: string | null;
  position: number;
  createdAt: number;
}

export interface FileSystem {
  files: Record<string, FileNode>;
  folders: Record<string, FolderNode>;
}

export interface ImportedFile {
  name: string;
  content: string;
  path: string[];
}

const STORAGE_KEY = 'markup_filesystem';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function loadFileSystem(): FileSystem {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error('Failed to load filesystem from localStorage:', err);
  }
  return { files: {}, folders: {} };
}

function saveFileSystem(fs: FileSystem): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fs));
  } catch (err) {
    console.error('Failed to save filesystem to localStorage:', err);
  }
}

let fileSystem: FileSystem = loadFileSystem();

export function createFile(name: string, parentId: string | null = null, content: string = ''): FileNode {
  const file: FileNode = {
    id: generateId(),
    name,
    content,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    parentId
  };

  fileSystem.files[file.id] = file;
  saveFileSystem(fileSystem);
  return file;
}

export function updateFile(fileId: string, updates: { name?: string; content?: string; parentId?: string | null }): FileNode {
  const file = fileSystem.files[fileId];
  if (!file) {
    throw new Error(`File ${fileId} not found`);
  }

  const updatedFile: FileNode = {
    ...file,
    ...updates,
    updatedAt: Date.now()
  };

  fileSystem.files[fileId] = updatedFile;
  saveFileSystem(fileSystem);
  return updatedFile;
}

export function removeFile(fileId: string): void {
  if (!fileSystem.files[fileId]) {
    throw new Error(`File ${fileId} not found`);
  }

  delete fileSystem.files[fileId];
  saveFileSystem(fileSystem);
}

export function createFolder(name: string, parentId: string | null = null): FolderNode {
  const siblings = Object.values(fileSystem.folders).filter(f => f.parentId === parentId);
  const maxPosition = siblings.length > 0 ? Math.max(...siblings.map(f => f.position)) : -1;

  const folder: FolderNode = {
    id: generateId(),
    name,
    parentId,
    position: maxPosition + 1,
    createdAt: Date.now()
  };

  fileSystem.folders[folder.id] = folder;
  saveFileSystem(fileSystem);
  return folder;
}

export function updateFolder(folderId: string, updates: { name?: string; parentId?: string | null; position?: number }): FolderNode {
  const folder = fileSystem.folders[folderId];
  if (!folder) {
    throw new Error(`Folder ${folderId} not found`);
  }

  const updatedFolder: FolderNode = {
    ...folder,
    ...updates
  };

  fileSystem.folders[folderId] = updatedFolder;
  saveFileSystem(fileSystem);
  return updatedFolder;
}

export function removeFolder(folderId: string): void {
  if (!fileSystem.folders[folderId]) {
    throw new Error(`Folder ${folderId} not found`);
  }

  const toDelete = new Set<string>([folderId]);
  const queue = [folderId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    Object.values(fileSystem.folders).forEach(folder => {
      if (folder.parentId === currentId && !toDelete.has(folder.id)) {
        toDelete.add(folder.id);
        queue.push(folder.id);
      }
    });

    Object.values(fileSystem.files).forEach(file => {
      if (file.parentId === currentId) {
        delete fileSystem.files[file.id];
      }
    });
  }

  toDelete.forEach(id => {
    delete fileSystem.folders[id];
  });

  saveFileSystem(fileSystem);
}

export function moveFolderPosition(folderId: string, newPosition: number): void {
  const folder = fileSystem.folders[folderId];
  if (!folder) {
    throw new Error(`Folder ${folderId} not found`);
  }

  const siblings = Object.values(fileSystem.folders)
    .filter(f => f.parentId === folder.parentId && f.id !== folderId)
    .sort((a, b) => a.position - b.position);

  siblings.splice(newPosition, 0, folder);

  siblings.forEach((f, index) => {
    fileSystem.folders[f.id].position = index;
  });

  saveFileSystem(fileSystem);
}

export function getFile(fileId: string): FileNode | null {
  return fileSystem.files[fileId] || null;
}

export function getFolder(folderId: string): FolderNode | null {
  return fileSystem.folders[folderId] || null;
}

export function getFilesInFolder(folderId: string | null): FileNode[] {
  return Object.values(fileSystem.files).filter(f => f.parentId === folderId);
}

export function getFoldersInFolder(parentId: string | null): FolderNode[] {
  return Object.values(fileSystem.folders)
    .filter(f => f.parentId === parentId)
    .sort((a, b) => a.position - b.position);
}

export function getAllFiles(): FileNode[] {
  return Object.values(fileSystem.files);
}

export function getAllFolders(): FolderNode[] {
  return Object.values(fileSystem.folders);
}

export function searchFiles(query: string): FileNode[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(fileSystem.files).filter(file => {
    return file.name.toLowerCase().includes(lowerQuery) ||
           file.content.toLowerCase().includes(lowerQuery);
  });
}

export function getFileSystem(): FileSystem {
  return fileSystem;
}

export function resetFileSystem(): void {
  fileSystem = { files: {}, folders: {} };
  saveFileSystem(fileSystem);
}

export function importFiles(files: ImportedFile[]): void {
  const folderMap = new Map<string, string>();

  files.forEach(({ name, content, path }) => {
    let parentId: string | null = null;

    path.forEach((folderName, index) => {
      const pathKey = path.slice(0, index + 1).join('/');

      if (!folderMap.has(pathKey)) {
        const folder = createFolder(folderName, parentId);
        folderMap.set(pathKey, folder.id);
      }

      parentId = folderMap.get(pathKey)!;
    });

    createFile(name, parentId, content);
  });
}

export function exportToJSON(): string {
  return JSON.stringify(fileSystem, null, 2);
}

export function importFromJSON(json: string): void {
  try {
    const imported = JSON.parse(json);
    fileSystem = imported;
    saveFileSystem(fileSystem);
  } catch (err) {
    throw new Error('Invalid JSON format');
  }
}
