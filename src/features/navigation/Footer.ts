import { getState, subscribe } from '../../core';

let unsubscribe: (() => void) | null = null;

export function renderFooter(): string {
  const state = getState();
  return `
    <footer class="footer">
      <div class="footer__container">
        <span class="footer__cursor">Line ${state.editorLine}, Column ${state.editorColumn}</span>
      </div>
    </footer>
  `;
}

function updateFooterCursor(): void {
  const state = getState();
  const cursorElement = document.querySelector('.footer__cursor');
  if (cursorElement) {
    cursorElement.textContent = `Line ${state.editorLine}, Column ${state.editorColumn}`;
  }
}

export function initFooter(): void {
  unsubscribe = subscribe((updates) => {
    if ('editorLine' in updates || 'editorColumn' in updates) {
      updateFooterCursor();
    }
  });
}

export function destroyFooter(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
