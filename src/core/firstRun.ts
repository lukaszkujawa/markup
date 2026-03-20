import { getState, setState, createFolder, createNote } from './state';

const FIRST_RUN_KEY = 'markup_first_run_complete';

export async function checkAndRunFirstTimeSetup(): Promise<void> {
  const hasRunBefore = localStorage.getItem(FIRST_RUN_KEY);

  if (hasRunBefore) {
    return;
  }

  const state = getState();

  if (Object.keys(state.folders).length > 0 || Object.keys(state.notes).length > 1) {
    localStorage.setItem(FIRST_RUN_KEY, 'true');
    return;
  }

  await initializeFirstRun();

  localStorage.setItem(FIRST_RUN_KEY, 'true');
}

async function initializeFirstRun(): Promise<void> {
  const quickstartFolder = await createFolder('quickstart');
  await createFolder('notes');
  await createFolder('todo');

  const welcomeContent = await fetchDocFile('Welcome.md');
  const d2Content = await fetchDocFile('D2Lang.md');
  const svgContent = await fetchDocFile('SVG.md');

  if (welcomeContent) {
    const welcomeNote = await createNote('Welcome', quickstartFolder.path);
    const state = getState();
    setState({
      notes: {
        ...state.notes,
        [welcomeNote.path]: {
          ...welcomeNote,
          content: welcomeContent
        }
      }
    });
  }

  if (d2Content) {
    const d2Note = await createNote('D2 Language Guide', quickstartFolder.path);
    const state = getState();
    setState({
      notes: {
        ...state.notes,
        [d2Note.path]: {
          ...d2Note,
          content: d2Content
        }
      }
    });
  }

  if (svgContent) {
    const svgNote = await createNote('SVG Rendering', quickstartFolder.path);
    const state = getState();
    setState({
      notes: {
        ...state.notes,
        [svgNote.path]: {
          ...svgNote,
          content: svgContent
        }
      }
    });
  }

  const state = getState();
  const defaultNote = state.notes['default'];
  if (defaultNote) {
    const { ['default']: removed, ...remainingNotes } = state.notes;
    setState({ notes: remainingNotes });
  }
}

async function fetchDocFile(filename: string): Promise<string | null> {
  try {
    const response = await fetch(`/docs/${filename}`);
    if (response.ok) {
      return await response.text();
    }
    return null;
  } catch (err) {
    console.error(`Failed to load ${filename}:`, err);
    return null;
  }
}
