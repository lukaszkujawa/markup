import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { getState } from '../../core';

export async function exportPreviewToPdf(): Promise<void> {
  const previewContainer = document.querySelector('.preview__container');
  const state = getState();
  const currentNote = state.currentNotePath ? state.notes[state.currentNotePath] : null;

  if (!previewContainer) {
    console.error('Preview container not found');
    return;
  }

  try {
    const defaultFileName = currentNote ? `${currentNote.title}.pdf` : 'document.pdf';

    const filePath = await save({
      defaultPath: defaultFileName,
      filters: [{
        name: 'PDF',
        extensions: ['pdf']
      }]
    });

    if (!filePath) {
      return;
    }

    const html2pdf = (await import('html2pdf.js')).default;

    const opt = {
      margin: [20, 15, 20, 15] as [number, number, number, number],
      filename: defaultFileName,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait' as const
      }
    };

    const pdfBlob = await html2pdf().set(opt).from(previewContainer as HTMLElement).output('blob');
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    await writeFile(filePath, uint8Array);

    console.log('PDF exported successfully to:', filePath);
  } catch (err) {
    console.error('Error exporting PDF:', err);
  }
}
