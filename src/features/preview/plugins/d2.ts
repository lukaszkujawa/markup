import { D2 } from '@terrastruct/d2';
import { registerCodeBlockRenderer } from '..';
import { createDiagramControls } from '../diagram-utils';

let d2Instance: D2 | null = null;

const MAX_CACHE_SIZE = 50;
const renderCache = new Map<string, string>();

const pendingRenders = new Map<string, number>();

interface RenderQueueItem {
  code: string;
  id: string;
  codeHash: string;
}

const renderQueue: RenderQueueItem[] = [];
let isProcessingQueue = false;

function evictOldestCacheEntry(): void {
  const firstKey = renderCache.keys().next().value;
  if (firstKey !== undefined) {
    renderCache.delete(firstKey);
  }
}

async function getD2Instance(): Promise<D2> {
  if (!d2Instance) {
    d2Instance = new D2();
  }
  return d2Instance;
}

function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

async function renderD2Diagram(code: string, id: string, codeHash: string): Promise<void> {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  if (renderCache.has(codeHash)) {
    element.className = 'd2-diagram';
    element.innerHTML = `
      ${createDiagramControls(id)}
      <div class="diagram-content">
        ${renderCache.get(codeHash)!}
      </div>
    `;
    return;
  }

  try {
    const d2 = await getD2Instance();
    const compileResult = await d2.compile(code);
    const svg = await d2.render(compileResult.diagram, compileResult.renderOptions);

    if (document.getElementById(id)) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = svg.trim();
      const svgElement = tempDiv.querySelector('svg');

      if (svgElement) {
        svgElement.removeAttribute('width');
        svgElement.removeAttribute('height');
        svgElement.style.width = '100%';
        svgElement.style.height = 'auto';

        const svgHTML = svgElement.outerHTML;

        if (renderCache.size >= MAX_CACHE_SIZE) {
          evictOldestCacheEntry();
        }
        renderCache.set(codeHash, svgHTML);

        const currentElement = document.getElementById(id);
        if (currentElement) {
          currentElement.className = 'd2-diagram';
          currentElement.innerHTML = `
            ${createDiagramControls(id)}
            <div class="diagram-content">
              ${svgHTML}
            </div>
          `;
        }
      }
    }
  } catch (err) {
    const currentElement = document.getElementById(id);
    if (currentElement) {
      currentElement.className = 'd2-diagram d2-diagram--error';
      currentElement.innerHTML = `
        <p>Error rendering D2 diagram</p>
        <pre>${err instanceof Error ? err.message : 'Unknown error'}</pre>
      `;
    }
  }
}

async function processRenderQueue(): Promise<void> {
  if (isProcessingQueue || renderQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  while (renderQueue.length > 0) {
    const item = renderQueue.shift();
    if (item) {
      await renderD2Diagram(item.code, item.id, item.codeHash);
      // Small delay between renders to prevent overwhelming the WASM instance
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  isProcessingQueue = false;
}

function queueRender(code: string, id: string, codeHash: string): void {
  renderQueue.push({ code, id, codeHash });
  processRenderQueue();
}

function scheduleRender(code: string, id: string, codeHash: string): void {
  if (pendingRenders.has(id)) {
    clearTimeout(pendingRenders.get(id)!);
  }

  const timeoutId = window.setTimeout(() => {
    queueRender(code, id, codeHash);
    pendingRenders.delete(id);
  }, 300);

  pendingRenders.set(id, timeoutId);
}

export function initD2Plugin(): void {
  registerCodeBlockRenderer('d2', (code) => {
    const codeHash = hashCode(code);
    const id = `d2-${codeHash}`;

    if (renderCache.has(codeHash)) {
      return `<div class="d2-diagram" id="${id}">
        ${createDiagramControls(id)}
        <div class="diagram-content">
          ${renderCache.get(codeHash)}
        </div>
      </div>`;
    }

    scheduleRender(code, id, codeHash);

    return `<div class="d2-diagram d2-diagram--loading" id="${id}">
      <p>Loading diagram...</p>
    </div>`;
  });
}

export function clearD2Cache(): void {
  renderCache.clear();
}

export function cancelPendingD2Renders(): void {
  pendingRenders.forEach((timeoutId) => {
    clearTimeout(timeoutId);
  });
  pendingRenders.clear();
}

export function destroyD2Plugin(): void {
  cancelPendingD2Renders();
  clearD2Cache();
  d2Instance = null;
}
