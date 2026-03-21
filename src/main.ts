import { renderLayout, initLayout, destroyLayout } from "./features/layout";
import { initEditor, destroyEditor } from "./features/editor";
import { initPreview, destroyPreview } from "./features/preview";
import { initTopNav, destroyTopNav, initFileNav, destroyFileNav, initFooter, destroyFooter } from "./features/navigation";
import { initCodePlugin } from "./features/preview/plugins/code";
import { initD2Plugin, destroyD2Plugin } from "./features/preview/plugins/d2";
import { initSVGPlugin } from "./features/preview/plugins/svg";
import { initDiagramHandlers } from "./features/preview/diagram-utils";
import { checkAndRunFirstTimeSetup, increaseFontSize, decreaseFontSize, resetFontSize } from "./core";
import { initializeState } from "./core/state";
import { listen } from '@tauri-apps/api/event';

function handleGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === '=') {
    e.preventDefault();
    increaseFontSize();
  } else if ((e.metaKey || e.ctrlKey) && e.key === '-') {
    e.preventDefault();
    decreaseFontSize();
  } else if ((e.metaKey || e.ctrlKey) && e.key === '0') {
    e.preventDefault();
    resetFontSize();
  }
}

async function initApp() {
  await initializeState();
  await checkAndRunFirstTimeSetup();

  const app = document.querySelector("#app");
  if (app) {
    app.innerHTML = renderLayout();

    initCodePlugin();
    initD2Plugin();
    initSVGPlugin();
    initDiagramHandlers();
    initTopNav();
    initFileNav();
    initFooter();
    initEditor();
    initPreview();
    initLayout();
  }

  window.addEventListener('keydown', handleGlobalKeydown);

  await listen('menu:undo', async () => {
    const editorView = (await import('./features/editor')).getEditorView();
    if (editorView) {
      const { undo } = await import('@codemirror/commands');
      undo(editorView);
    }
  });

  await listen('menu:redo', async () => {
    const editorView = (await import('./features/editor')).getEditorView();
    if (editorView) {
      const { redo } = await import('@codemirror/commands');
      redo(editorView);
    }
  });

  await listen('menu:cut', async () => {
    const editorView = (await import('./features/editor')).getEditorView();
    if (editorView && editorView.hasFocus) {
      const selection = editorView.state.selection.main;
      const text = editorView.state.sliceDoc(selection.from, selection.to);
      const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
      await writeText(text);
      editorView.dispatch({
        changes: { from: selection.from, to: selection.to, insert: '' }
      });
    }
  });

  await listen('menu:copy', async () => {
    const editorView = (await import('./features/editor')).getEditorView();
    if (editorView && editorView.hasFocus) {
      const selection = editorView.state.selection.main;
      const text = editorView.state.sliceDoc(selection.from, selection.to);
      const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
      await writeText(text);
    }
  });

  await listen('menu:paste', async () => {
    const editorView = (await import('./features/editor')).getEditorView();
    if (editorView && editorView.hasFocus) {
      const { readText } = await import('@tauri-apps/plugin-clipboard-manager');
      const text = await readText();
      if (text) {
        const selection = editorView.state.selection.main;
        editorView.dispatch({
          changes: { from: selection.from, to: selection.to, insert: text },
          selection: { anchor: selection.from + text.length }
        });
      }
    }
  });

  await listen('menu:increase-font', () => {
    increaseFontSize();
  });

  await listen('menu:decrease-font', () => {
    decreaseFontSize();
  });

  await listen('menu:reset-font', () => {
    resetFontSize();
  });
}

function cleanupApp() {
  window.removeEventListener('keydown', handleGlobalKeydown);
  destroyTopNav();
  destroyFileNav();
  destroyFooter();
  destroyEditor();
  destroyPreview();
  destroyD2Plugin();
  destroyLayout();
}

window.addEventListener("DOMContentLoaded", initApp);

window.addEventListener("beforeunload", cleanupApp);
