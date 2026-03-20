import { marked, Renderer } from 'marked';
import { subscribe, getState, getCurrentNoteContent, updateNoteContent } from '../../core';

type CodeBlockRenderer = (code: string, language: string) => string;

const codeBlockRenderers: Map<string, CodeBlockRenderer> = new Map();

export function registerCodeBlockRenderer(language: string, renderer: CodeBlockRenderer): void {
  codeBlockRenderers.set(language, renderer);
}

function defaultCodeBlockRenderer(code: string, language: string): string {
  if (codeBlockRenderers.has(language)) {
    return codeBlockRenderers.get(language)!(code, language);
  }

  return `<pre><code>${code}</code></pre>`;
}

export function renderPreview(): string {
  return `
    <section class="preview">
      <div class="preview__container">
        <div id="preview-content"></div>
      </div>
    </section>
  `;
}

let unsubscribe: (() => void) | null = null;

export function initPreview(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  const container = document.getElementById('preview-content');

  if (!container) {
    throw new Error('Preview container not found');
  }

  const renderer = new Renderer();

  renderer.code = function({ text, lang }: { text: string; lang?: string }): string {
    const language = lang || '';
    return defaultCodeBlockRenderer(text, language);
  };

  marked.setOptions({
    breaks: true,
    gfm: true,
    renderer: renderer,
  });

  const handleCheckboxChange = (index: number, checked: boolean) => {
    const state = getState();
    const currentNotePath = state.currentNotePath;
    if (!currentNotePath) return;

    const markdown = getCurrentNoteContent();
    const lines = markdown.split('\n');
    let checkboxCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const uncheckedMatch = line.match(/^(\s*[-*+]\s+)\[ \]/);
      const checkedMatch = line.match(/^(\s*[-*+]\s+)\[x\]/i);

      if (uncheckedMatch || checkedMatch) {
        if (checkboxCount === index) {
          if (checked) {
            lines[i] = line.replace(/\[ \]/, '[x]');
          } else {
            lines[i] = line.replace(/\[x\]/i, '[ ]');
          }
          break;
        }
        checkboxCount++;
      }
    }

    const updatedMarkdown = lines.join('\n');
    updateNoteContent(currentNotePath, updatedMarkdown);
  };

  const updatePreview = () => {
    const markdown = getCurrentNoteContent();
    const html = marked(markdown);
    container.innerHTML = html as string;

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox, index) => {
      const input = checkbox as HTMLInputElement;
      input.disabled = false;

      input.addEventListener('change', () => {
        handleCheckboxChange(index, input.checked);
      });
    });
  };

  updatePreview();

  unsubscribe = subscribe((updates) => {
    const state = getState();
    const currentNotePath = state.currentNotePath;

    if ('currentNotePath' in updates || (currentNotePath && updates.notes?.[currentNotePath])) {
      updatePreview();
    }

    if ('editorScrollPercent' in updates) {
      const previewSection = container.parentElement?.parentElement;
      if (previewSection) {
        const scrollPercent = state.editorScrollPercent;
        const maxScroll = previewSection.scrollHeight - previewSection.clientHeight;
        const targetScrollTop = maxScroll * scrollPercent;
        previewSection.scrollTop = targetScrollTop;
      }
    }
  });
}

export function destroyPreview(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  const container = document.getElementById('preview-content');
  if (container) {
    container.innerHTML = '';
  }
}
