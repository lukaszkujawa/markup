export async function downloadDiagram(diagramId: string, defaultFileName: string = 'diagram.svg'): Promise<void> {
  const diagram = document.getElementById(diagramId);
  if (!diagram) return;

  const svg = diagram.querySelector('.diagram-content svg');
  if (!svg) return;

  try {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeTextFile } = await import('@tauri-apps/plugin-fs');

    const svgData = svg.outerHTML;

    const filePath = await save({
      defaultPath: defaultFileName,
      filters: [{
        name: 'SVG',
        extensions: ['svg']
      }]
    });

    if (filePath) {
      await writeTextFile(filePath, svgData);
    }
  } catch (err) {
    console.error('Error downloading diagram:', err);
  }
}
