export function createDiagramControls(diagramId: string): string {
  return `
    <div class="diagram-controls">
      <button class="diagram-btn diagram-btn--fullscreen" data-diagram-id="${diagramId}" title="Fullscreen">
        <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M 3 3 L 8 3 M 3 3 L 3 8 M 17 3 L 12 3 M 17 3 L 17 8 M 3 17 L 8 17 M 3 17 L 3 12 M 17 17 L 12 17 M 17 17 L 17 12"
                stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
      </button>
      <button class="diagram-btn diagram-btn--download" data-diagram-id="${diagramId}" title="Download">
        <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M 10 3 L 10 13 M 6 9 L 10 13 L 14 9 M 4 17 L 16 17"
                stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
      </button>
    </div>
  `;
}
