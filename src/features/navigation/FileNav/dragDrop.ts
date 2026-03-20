import { getState, moveNoteToFolder, moveFolderToParent, toggleFolderExpanded, reorderFolder } from '../../../core';
import { CONSTANTS } from './constants';

interface DragState {
  isDragging: boolean;
  element: HTMLElement | null;
  type: 'note' | 'folder' | null;
  path: string | null;
  startX: number;
  startY: number;
}

interface DropTarget {
  type: 'into-folder' | 'before' | 'after' | 'root';
  folderPath: string | null;
  referenceElement?: HTMLElement;
}

const dragState: DragState = {
  isDragging: false,
  element: null,
  type: null,
  path: null,
  startX: 0,
  startY: 0
};

let expandTimeout: NodeJS.Timeout | null = null;
let lastHoveredFolderPath: string | null = null;
let dropIndicator: HTMLElement | null = null;
let currentDropTarget: DropTarget | null = null;

function createDropIndicator(): HTMLElement {
  if (!dropIndicator) {
    dropIndicator = document.createElement('div');
    dropIndicator.className = 'file-nav__drop-indicator';
    document.body.appendChild(dropIndicator);
  }
  return dropIndicator;
}

function hideDropIndicator(): void {
  if (dropIndicator) {
    dropIndicator.style.display = 'none';
  }
  currentDropTarget = null;
}

function showDropIndicator(element: HTMLElement, position: 'before' | 'after'): void {
  const indicator = createDropIndicator();
  const rect = element.getBoundingClientRect();
  const y = position === 'before' ? rect.top : rect.bottom;

  indicator.style.display = 'block';
  indicator.style.left = `${rect.left}px`;
  indicator.style.top = `${y}px`;
  indicator.style.width = `${rect.width}px`;
}

function clearDragHighlights(container: Element): void {
  container.querySelectorAll(`.${CONSTANTS.CLASSES.DRAG_HIGHLIGHT}`).forEach(el => {
    el.classList.remove(CONSTANTS.CLASSES.DRAG_HIGHLIGHT);
  });
}

function clearExpandTimeout(): void {
  if (expandTimeout) {
    clearTimeout(expandTimeout);
    expandTimeout = null;
  }
  lastHoveredFolderPath = null;
}

function resetDragState(): void {
  if (dragState.element) {
    dragState.element.style.opacity = '';
  }
  clearExpandTimeout();
  hideDropIndicator();
  dragState.isDragging = false;
  dragState.element = null;
  dragState.type = null;
  dragState.path = null;
  dragState.startX = 0;
  dragState.startY = 0;
}

function startDrag(element: HTMLElement, type: 'note' | 'folder', path: string, x: number, y: number): void {
  dragState.element = element;
  dragState.type = type;
  dragState.path = path;
  dragState.startX = x;
  dragState.startY = y;
  dragState.isDragging = false;
}

function activateDrag(): void {
  if (dragState.element) {
    dragState.element.style.opacity = '0.5';
    dragState.isDragging = true;
  }
}

function scheduleAutoExpand(folderPath: string, folderElement: HTMLElement): void {
  if (lastHoveredFolderPath === folderPath) return;

  lastHoveredFolderPath = folderPath;
  clearExpandTimeout();

  const isCollapsed = folderElement.classList.contains(CONSTANTS.CLASSES.COLLAPSED);
  if (isCollapsed) {
    expandTimeout = setTimeout(() => {
      toggleFolderExpanded(folderPath);
    }, CONSTANTS.DRAG.AUTO_EXPAND_DELAY);
  }
}

function setFolderDropTarget(folderPath: string, folderElement: HTMLElement): void {
  folderElement.classList.add(CONSTANTS.CLASSES.DRAG_HIGHLIGHT);
  currentDropTarget = { type: 'into-folder', folderPath };
  scheduleAutoExpand(folderPath, folderElement);
}

function getDropZone(rect: DOMRect, mouseY: number): 'before' | 'after' | 'center' {
  const relativeY = (mouseY - rect.top) / rect.height;
  if (relativeY < CONSTANTS.DRAG.DROP_ZONE_THRESHOLD) return 'before';
  if (relativeY > (1 - CONSTANTS.DRAG.DROP_ZONE_THRESHOLD)) return 'after';
  return 'center';
}

function handleFolderDragOver(folderHeader: HTMLElement, mouseY: number): void {
  const folderElement = folderHeader.closest('.file-nav__folder') as HTMLElement;
  if (!folderElement) return;

  const folderPath = folderElement.getAttribute('data-folder-path');
  if (!folderPath || folderPath === dragState.path) return;

  const draggedFolder = getState().folders[dragState.path!];
  if (draggedFolder && folderPath === draggedFolder.parentPath) return;

  const zone = getDropZone(folderHeader.getBoundingClientRect(), mouseY);

  if (zone === 'before') {
    showDropIndicator(folderHeader, 'before');
    currentDropTarget = { type: 'before', folderPath, referenceElement: folderElement };
  } else if (zone === 'after') {
    showDropIndicator(folderHeader, 'after');
    currentDropTarget = { type: 'after', folderPath, referenceElement: folderElement };
  } else {
    setFolderDropTarget(folderPath, folderElement);
  }
}

function handleNoteDragOverFolder(folderHeader: HTMLElement): void {
  const folderElement = folderHeader.closest('.file-nav__folder') as HTMLElement;
  if (!folderElement) return;

  const folderPath = folderElement.getAttribute('data-folder-path');
  if (!folderPath) return;

  setFolderDropTarget(folderPath, folderElement);
}

function handleFolderDragOverFolderBody(folderElement: HTMLElement, mouseY: number): void {
  const folderPath = folderElement.getAttribute('data-folder-path');
  if (!folderPath || folderPath === dragState.path) return;

  const draggedFolder = getState().folders[dragState.path!];
  if (!draggedFolder) return;

  const relativeY = (mouseY - folderElement.getBoundingClientRect().top) / folderElement.getBoundingClientRect().height;

  if (relativeY > 0.7) {
    showDropIndicator(folderElement, 'after');
    currentDropTarget = { type: 'after', folderPath, referenceElement: folderElement };
  }
}

function handleDragToRoot(container: Element): void {
  clearExpandTimeout();
  currentDropTarget = { type: 'root', folderPath: null };

  if (dragState.type === 'note') {
    const draggedNote = getState().notes[dragState.path!];
    if (draggedNote?.folderPath) {
      const listContainer = container.querySelector('.file-nav__list') as HTMLElement;
      const lastRootItem = listContainer?.querySelectorAll(':scope > .file-nav__folder, :scope > .file-nav__item');
      if (lastRootItem?.length) {
        showDropIndicator(lastRootItem[lastRootItem.length - 1] as HTMLElement, 'after');
      }
    }
  }
}

function handleMouseDown(e: Event): void {
  const mouseEvent = e as MouseEvent;
  const target = mouseEvent.target as HTMLElement;

  const noteItem = target.closest('.file-nav__item[draggable="true"]') as HTMLElement;
  if (noteItem) {
    const notePath = noteItem.getAttribute('data-note-path');
    if (notePath) {
      startDrag(noteItem, 'note', notePath, mouseEvent.clientX, mouseEvent.clientY);
      mouseEvent.preventDefault();
    }
    return;
  }

  const folderHeader = target.closest('.file-nav__folder-header[draggable="true"]') as HTMLElement;
  if (folderHeader) {
    const folderElement = folderHeader.closest('.file-nav__folder') as HTMLElement;
    const folderPath = folderElement?.getAttribute('data-folder-path');
    if (folderPath && folderElement) {
      startDrag(folderElement, 'folder', folderPath, mouseEvent.clientX, mouseEvent.clientY);
      mouseEvent.preventDefault();
    }
  }
}

function handleMouseMove(e: Event, container: Element): void {
  const mouseEvent = e as MouseEvent;

  if (!dragState.path) return;

  if (!dragState.isDragging) {
    const deltaX = Math.abs(mouseEvent.clientX - dragState.startX);
    const deltaY = Math.abs(mouseEvent.clientY - dragState.startY);

    if (deltaX > CONSTANTS.DRAG.THRESHOLD || deltaY > CONSTANTS.DRAG.THRESHOLD) {
      activateDrag();
    }
    return;
  }

  const target = mouseEvent.target as HTMLElement;
  clearDragHighlights(container);
  hideDropIndicator();

  const folderHeader = target.closest('.file-nav__folder-header') as HTMLElement;
  const folderElement = target.closest('.file-nav__folder') as HTMLElement;

  if (dragState.type === 'folder' && folderHeader) {
    handleFolderDragOver(folderHeader, mouseEvent.clientY);
  } else if (dragState.type === 'note' && folderHeader) {
    handleNoteDragOverFolder(folderHeader);
  } else if (dragState.type === 'folder' && folderElement) {
    handleFolderDragOverFolderBody(folderElement, mouseEvent.clientY);
  } else {
    handleDragToRoot(container);
  }
}

async function executeNoteDrop(notePath: string, target: DropTarget): Promise<void> {
  const state = getState();

  if (target.type === 'into-folder') {
    await moveNoteToFolder(notePath, target.folderPath);
    if (target.folderPath) {
      const folder = state.folders[target.folderPath];
      if (folder && !folder.isExpanded) {
        toggleFolderExpanded(target.folderPath);
      }
    }
  } else if (target.type === 'root') {
    await moveNoteToFolder(notePath, null);
  }
}

function isDescendantOf(folderPath: string, potentialAncestorPath: string, folders: Record<string, import('../../../core').Folder>): boolean {
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
    currentPath = folders[currentPath]?.parentPath ?? null;
  }

  return false;
}

async function executeFolderDrop(folderPath: string, target: DropTarget): Promise<void> {
  const state = getState();

  if (target.type === 'into-folder' && target.folderPath !== folderPath) {
    if (target.folderPath && isDescendantOf(target.folderPath, folderPath, state.folders)) {
      console.warn('Cannot move folder into its own descendant');
      return;
    }

    await moveFolderToParent(folderPath, target.folderPath);
    if (target.folderPath) {
      const folder = state.folders[target.folderPath];
      if (folder && !folder.isExpanded) {
        toggleFolderExpanded(target.folderPath);
      }
    }
  } else if (target.type === 'before' || target.type === 'after') {
    const referenceFolderPath = target.folderPath;
    if (referenceFolderPath && referenceFolderPath !== folderPath) {
      const referenceFolder = state.folders[referenceFolderPath];
      if (referenceFolder) {
        const siblings = Object.values(state.folders)
          .filter(f => f.parentPath === referenceFolder.parentPath && f.path !== folderPath)
          .sort((a, b) => a.position - b.position);

        const referenceIndex = siblings.findIndex(f => f.path === referenceFolderPath);
        const newPosition = target.type === 'before' ? referenceIndex : referenceIndex + 1;

        reorderFolder(folderPath, newPosition, referenceFolder.parentPath);
      }
    }
  } else if (target.type === 'root') {
    const draggedFolder = state.folders[folderPath];
    if (draggedFolder?.parentPath !== null) {
      await moveFolderToParent(folderPath, null);
    }
  }
}

async function handleMouseUp(): Promise<void> {
  if (!dragState.path || !dragState.isDragging) {
    resetDragState();
    return;
  }

  if (currentDropTarget && dragState.path) {
    if (dragState.type === 'note') {
      await executeNoteDrop(dragState.path, currentDropTarget);
    } else if (dragState.type === 'folder') {
      await executeFolderDrop(dragState.path, currentDropTarget);
    }
  }

  resetDragState();
}

function handleGlobalMouseUp(): void {
  if (dragState.path || dragState.isDragging) {
    resetDragState();
  }
}

export function setupDragAndDrop(container: Element): void {
  container.addEventListener('mousedown', handleMouseDown);
  container.addEventListener('mousemove', (e) => handleMouseMove(e, container));
  container.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('mouseup', handleGlobalMouseUp);
}

export function cleanupDragDrop(): void {
  resetDragState();
  document.removeEventListener('mouseup', handleGlobalMouseUp);
  if (dropIndicator && dropIndicator.parentNode) {
    dropIndicator.parentNode.removeChild(dropIndicator);
    dropIndicator = null;
  }
}
