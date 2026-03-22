import { renderTopNav, renderFileNav, renderSearchPanel, renderFooter, renderIconRail, initFileNav, destroyFileNav, initSearchPanel, destroySearchPanel, initIconRail, destroyIconRail } from '../navigation';
import { renderEditor } from '../editor';
import { renderPreview } from '../preview';
import { subscribe, getState } from '../../core';

let unsubscribe: (() => void) | null = null;

export function renderLayout(): string {
  const state = getState();

  return `
    <div class="layout">
      <header class="layout__top">
        ${renderTopNav()}
      </header>

      <main class="layout__content">
        <div class="layout__sidebar">
          ${renderIconRail()}
          <aside class="layout__file-nav" id="sidebar-container">
            ${state.searchMode ? renderSearchPanel() : renderFileNav()}
          </aside>
        </div>

        <section class="layout__editor">
          ${renderEditor()}
        </section>

        <section class="layout__preview">
          ${renderPreview()}
        </section>
      </main>

      <footer class="layout__footer">
        ${renderFooter()}
      </footer>
    </div>
  `;
}

function updateLayoutVisibility(): void {
  const state = getState();

  const fileNavEl = document.querySelector('.layout__file-nav');
  const editorEl = document.querySelector('.layout__editor');
  const previewEl = document.querySelector('.layout__preview');

  if (fileNavEl) {
    if (state.showFileNav) {
      fileNavEl.classList.remove('layout__file-nav--hidden');
    } else {
      fileNavEl.classList.add('layout__file-nav--hidden');
    }
  }

  if (editorEl) {
    if (state.showEditor) {
      editorEl.classList.remove('layout__editor--hidden');
    } else {
      editorEl.classList.add('layout__editor--hidden');
    }
  }

  if (previewEl) {
    if (state.showPreview) {
      previewEl.classList.remove('layout__preview--hidden');
    } else {
      previewEl.classList.add('layout__preview--hidden');
    }
  }
}

function updateSidebarContent(): void {
  const state = getState();
  const sidebarContainer = document.getElementById('sidebar-container');

  if (sidebarContainer) {
    if (state.searchMode) {
      destroyFileNav();
      sidebarContainer.innerHTML = renderSearchPanel();
      initSearchPanel();
    } else {
      destroySearchPanel();
      sidebarContainer.innerHTML = renderFileNav();
      initFileNav();
    }
  }
}

export function initLayout(): void {
  updateLayoutVisibility();
  initIconRail();

  unsubscribe = subscribe((updates) => {
    if ('showFileNav' in updates || 'showEditor' in updates || 'showPreview' in updates) {
      updateLayoutVisibility();
    }
    if ('searchMode' in updates) {
      updateSidebarContent();
    }
  });
}

export function destroyLayout(): void {
  destroyIconRail();

  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
