import { invoke } from '@tauri-apps/api/core';

export interface FileSystemEntry {
  path: string;
  name: string;
  is_directory: boolean;
  modified_at?: number;
}

export interface NoteMetadata {
  position: number;
  created_at: number;
  modified_at: number;
}

export interface FolderMetadata {
  position: number;
  is_expanded: boolean;
  created_at: number;
}

export interface AppMetadata {
  current_note_path: string | null;
  editor_scroll_percent: number;
  editor_line: number;
  editor_column: number;
  show_file_nav: boolean;
  show_editor: boolean;
  show_preview: boolean;
  font_size?: number;
  folders: Record<string, FolderMetadata>;
  notes: Record<string, NoteMetadata>;
}

export async function initializeStorage(): Promise<void> {
  await invoke('initialize_storage');
}

export async function listNotes(): Promise<FileSystemEntry[]> {
  return await invoke<FileSystemEntry[]>('list_notes');
}

export async function readNote(relativePath: string): Promise<string> {
  return await invoke<string>('read_note', { relativePath });
}

export async function writeNote(relativePath: string, content: string): Promise<void> {
  await invoke('write_note', { relativePath, content });
}

export async function deleteNote(relativePath: string): Promise<void> {
  await invoke('delete_note', { relativePath });
}

export async function createFolder(relativePath: string): Promise<void> {
  await invoke('create_folder', { relativePath });
}

export async function deleteFolder(relativePath: string): Promise<void> {
  await invoke('delete_folder', { relativePath });
}

export async function readMetadata(): Promise<AppMetadata> {
  const json = await invoke<string>('read_metadata');
  if (!json || json === '{}') {
    return {
      current_note_path: null,
      editor_scroll_percent: 0,
      editor_line: 1,
      editor_column: 1,
      show_file_nav: true,
      show_editor: true,
      show_preview: true,
      folders: {},
      notes: {}
    };
  }
  return JSON.parse(json);
}

export async function writeMetadata(metadata: AppMetadata): Promise<void> {
  const json = JSON.stringify(metadata, null, 2);
  await invoke('write_metadata', { metadata: json });
}

export async function moveNote(oldPath: string, newPath: string): Promise<void> {
  await invoke('move_note', { oldPath, newPath });
}

export async function moveFolder(oldPath: string, newPath: string): Promise<void> {
  await invoke('move_folder', { oldPath, newPath });
}

export function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200);
}

export function pathToId(path: string): string {
  return path.replace(/\\/g, '/');
}

export function getFolderPath(path: string): string | null {
  const parts = path.split('/');
  if (parts.length === 1) {
    return null;
  }
  return parts.slice(0, -1).join('/');
}

export function getFileName(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1];
}
