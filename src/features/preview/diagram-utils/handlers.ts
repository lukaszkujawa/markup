import { openFullscreen } from './fullscreen';
import { downloadDiagram } from './download';

let handlersInitialized = false;

function handleDiagramClick(e: MouseEvent): void {
  const target = e.target as HTMLElement;
  const fullscreenBtn = target.closest('.diagram-btn--fullscreen');
  const downloadBtn = target.closest('.diagram-btn--download');

  if (fullscreenBtn) {
    const diagramId = fullscreenBtn.getAttribute('data-diagram-id');
    if (diagramId) {
      openFullscreen(diagramId);
    }
  }

  if (downloadBtn) {
    const diagramId = downloadBtn.getAttribute('data-diagram-id');
    if (diagramId) {
      downloadDiagram(diagramId);
    }
  }
}

export function initDiagramHandlers(): void {
  if (!handlersInitialized) {
    document.addEventListener('click', handleDiagramClick);
    handlersInitialized = true;
  }
}
