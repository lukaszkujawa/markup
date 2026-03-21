interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
  lastMouseX: number;
  lastMouseY: number;
}

function svgToImage(svgElement: SVGElement): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = async () => {
      try {
        await img.decode();
        URL.revokeObjectURL(url);
        resolve(img);
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG as image'));
    };
    img.src = url;
  });
}

function drawCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  viewState: ViewState
): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(viewState.offsetX, viewState.offsetY);
  ctx.scale(viewState.scale, viewState.scale);

  ctx.drawImage(image, 0, 0);

  ctx.restore();
}

export function openFullscreen(diagramId: string): void {
  const diagram = document.getElementById(diagramId);
  if (!diagram) return;

  const content = diagram.querySelector('.diagram-content');
  if (!content) return;

  const svgElement = content.querySelector('svg');
  if (!svgElement) return;

  const overlay = document.createElement('div');
  overlay.className = 'diagram-fullscreen-overlay';
  overlay.innerHTML = `
    <div class="diagram-fullscreen-content">
      <button class="diagram-fullscreen-close" title="Close (ESC)">
        <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M 5 5 L 15 15 M 15 5 L 5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="diagram-fullscreen-container">
        <canvas class="diagram-fullscreen-canvas"></canvas>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const canvas = overlay.querySelector('.diagram-fullscreen-canvas') as HTMLCanvasElement;
  const container = overlay.querySelector('.diagram-fullscreen-container') as HTMLElement;

  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    overlay.remove();
    return;
  }

  const viewState: ViewState = {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
  };

  setTimeout(() => {
    svgToImage(svgElement).then((image) => {
      viewState.offsetX = (canvas.width - image.width) / 2;
      viewState.offsetY = (canvas.height - image.height) / 2;

      requestAnimationFrame(() => {
        drawCanvas(canvas, ctx, image, viewState);
        requestAnimationFrame(() => {
          drawCanvas(canvas, ctx, image, viewState);
        });
      });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const worldX = (centerX - viewState.offsetX) / viewState.scale;
      const worldY = (centerY - viewState.offsetY) / viewState.scale;

      const delta = e.deltaY > 0 ? 0.95 : 1.05;
      viewState.scale = Math.max(0.1, Math.min(10, viewState.scale * delta));

      viewState.offsetX = centerX - worldX * viewState.scale;
      viewState.offsetY = centerY - worldY * viewState.scale;

      drawCanvas(canvas, ctx, image, viewState);
    });

    canvas.addEventListener('mousedown', (e) => {
      viewState.isDragging = true;
      viewState.lastMouseX = e.clientX;
      viewState.lastMouseY = e.clientY;
      canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!viewState.isDragging) return;

      const dx = e.clientX - viewState.lastMouseX;
      const dy = e.clientY - viewState.lastMouseY;

      viewState.offsetX += dx;
      viewState.offsetY += dy;

      viewState.lastMouseX = e.clientX;
      viewState.lastMouseY = e.clientY;

      drawCanvas(canvas, ctx, image, viewState);
    });

    canvas.addEventListener('mouseup', () => {
      viewState.isDragging = false;
      canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('mouseleave', () => {
      viewState.isDragging = false;
      canvas.style.cursor = 'grab';
    });

      canvas.style.cursor = 'grab';
    }).catch((err) => {
      console.error('Failed to render diagram in fullscreen:', err);
      overlay.remove();
    });
  }, 50);

  const closeBtn = overlay.querySelector('.diagram-fullscreen-close');
  const closeFullscreen = () => {
    overlay.remove();
  };

  closeBtn?.addEventListener('click', closeFullscreen);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeFullscreen();
    }
  });

  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      closeFullscreen();
      document.removeEventListener('keydown', escHandler);
    }
  });
}
