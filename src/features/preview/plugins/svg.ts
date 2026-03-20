import { registerCodeBlockRenderer } from '..';
import { createDiagramControls } from '../diagram-utils';

function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function sanitizeSVG(svgCode: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = svgCode.trim();

  const svgElement = tempDiv.querySelector('svg');

  if (!svgElement) {
    throw new Error('Invalid SVG: No <svg> element found');
  }

  // Remove any script tags for security
  const scripts = svgElement.querySelectorAll('script');
  scripts.forEach(script => script.remove());

  // Remove event handlers for security
  const allElements = svgElement.querySelectorAll('*');
  allElements.forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    });
  });

  // Ensure SVG is responsive
  if (!svgElement.hasAttribute('viewBox') && svgElement.hasAttribute('width') && svgElement.hasAttribute('height')) {
    const width = svgElement.getAttribute('width');
    const height = svgElement.getAttribute('height');
    svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }

  svgElement.removeAttribute('width');
  svgElement.removeAttribute('height');
  svgElement.style.width = '100%';
  svgElement.style.height = 'auto';

  return svgElement.outerHTML;
}

export function initSVGPlugin(): void {
  registerCodeBlockRenderer('svg', (code) => {
    const codeHash = hashCode(code);
    const id = `svg-${codeHash}`;

    try {
      const sanitizedSVG = sanitizeSVG(code);

      return `<div class="svg-diagram" id="${id}">
        ${createDiagramControls(id)}
        <div class="diagram-content">
          ${sanitizedSVG}
        </div>
      </div>`;
    } catch (err) {
      return `<div class="svg-diagram svg-diagram--error" id="${id}">
        <p>Error rendering SVG</p>
        <pre>${err instanceof Error ? err.message : 'Invalid SVG code'}</pre>
      </div>`;
    }
  });
}
