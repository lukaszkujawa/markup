import { EditorView } from '@codemirror/view';

export function applyBold(view: EditorView): void {
  const selection = view.state.selection.main;
  const selectedText = view.state.sliceDoc(selection.from, selection.to);

  if (selectedText) {
    if (selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length > 4) {
      const unwrapped = selectedText.slice(2, -2);
      view.dispatch({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: unwrapped
        },
        selection: { anchor: selection.from, head: selection.from + unwrapped.length }
      });
    } else {
      const beforeTwo = selection.from >= 2 ? view.state.sliceDoc(selection.from - 2, selection.from) : '';
      const afterTwo = selection.to + 2 <= view.state.doc.length ? view.state.sliceDoc(selection.to, selection.to + 2) : '';

      if (beforeTwo === '**' && afterTwo === '**') {
        view.dispatch({
          changes: [
            { from: selection.from - 2, to: selection.from, insert: '' },
            { from: selection.to, to: selection.to + 2, insert: '' }
          ],
          selection: { anchor: selection.from - 2, head: selection.to - 2 }
        });
      } else {
        view.dispatch({
          changes: {
            from: selection.from,
            to: selection.to,
            insert: `**${selectedText}**`
          },
          selection: { anchor: selection.from + 2, head: selection.to + 2 }
        });
      }
    }
  } else {
    view.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: '****'
      },
      selection: { anchor: selection.from + 2 }
    });
  }
  view.focus();
}

export function applyItalic(view: EditorView): void {
  const selection = view.state.selection.main;
  const selectedText = view.state.sliceDoc(selection.from, selection.to);

  if (selectedText) {
    if (selectedText.startsWith('*') && selectedText.endsWith('*') && selectedText.length > 2 && !selectedText.startsWith('**')) {
      const unwrapped = selectedText.slice(1, -1);
      view.dispatch({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: unwrapped
        },
        selection: { anchor: selection.from, head: selection.from + unwrapped.length }
      });
    } else {
      const beforeOne = selection.from >= 1 ? view.state.sliceDoc(selection.from - 1, selection.from) : '';
      const afterOne = selection.to + 1 <= view.state.doc.length ? view.state.sliceDoc(selection.to, selection.to + 1) : '';
      const beforeTwo = selection.from >= 2 ? view.state.sliceDoc(selection.from - 2, selection.from) : '';
      const afterTwo = selection.to + 2 <= view.state.doc.length ? view.state.sliceDoc(selection.to, selection.to + 2) : '';

      if (beforeOne === '*' && afterOne === '*' && beforeTwo !== '**' && afterTwo !== '**') {
        view.dispatch({
          changes: [
            { from: selection.from - 1, to: selection.from, insert: '' },
            { from: selection.to, to: selection.to + 1, insert: '' }
          ],
          selection: { anchor: selection.from - 1, head: selection.to - 1 }
        });
      } else {
        view.dispatch({
          changes: {
            from: selection.from,
            to: selection.to,
            insert: `*${selectedText}*`
          },
          selection: { anchor: selection.from + 1, head: selection.to + 1 }
        });
      }
    }
  } else {
    view.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: '**'
      },
      selection: { anchor: selection.from + 1 }
    });
  }
  view.focus();
}

export function applyHighlight(view: EditorView): void {
  const selection = view.state.selection.main;
  const selectedText = view.state.sliceDoc(selection.from, selection.to);

  if (selectedText) {
    if (selectedText.startsWith('==') && selectedText.endsWith('==') && selectedText.length > 4) {
      const unwrapped = selectedText.slice(2, -2);
      view.dispatch({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: unwrapped
        },
        selection: { anchor: selection.from, head: selection.from + unwrapped.length }
      });
    } else {
      const beforeTwo = selection.from >= 2 ? view.state.sliceDoc(selection.from - 2, selection.from) : '';
      const afterTwo = selection.to + 2 <= view.state.doc.length ? view.state.sliceDoc(selection.to, selection.to + 2) : '';

      if (beforeTwo === '==' && afterTwo === '==') {
        view.dispatch({
          changes: [
            { from: selection.from - 2, to: selection.from, insert: '' },
            { from: selection.to, to: selection.to + 2, insert: '' }
          ],
          selection: { anchor: selection.from - 2, head: selection.to - 2 }
        });
      } else {
        view.dispatch({
          changes: {
            from: selection.from,
            to: selection.to,
            insert: `==${selectedText}==`
          },
          selection: { anchor: selection.from + 2, head: selection.to + 2 }
        });
      }
    }
  } else {
    view.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: '===='
      },
      selection: { anchor: selection.from + 2 }
    });
  }
  view.focus();
}

export function applyHeading(view: EditorView): void {
  const selection = view.state.selection.main;
  const line = view.state.doc.lineAt(selection.from);
  const lineText = line.text;

  let newText: string;
  if (lineText.startsWith('### ')) {
    newText = lineText.replace(/^### /, '');
  } else if (lineText.startsWith('## ')) {
    newText = lineText.replace(/^## /, '### ');
  } else if (lineText.startsWith('# ')) {
    newText = lineText.replace(/^# /, '## ');
  } else {
    newText = '# ' + lineText;
  }

  view.dispatch({
    changes: {
      from: line.from,
      to: line.to,
      insert: newText
    }
  });
  view.focus();
}

export function applyCode(view: EditorView): void {
  const selection = view.state.selection.main;
  const doc = view.state.doc;
  const selectedText = view.state.sliceDoc(selection.from, selection.to);

  const startLine = doc.lineAt(selection.from);
  const endLine = doc.lineAt(selection.to);
  const isMultiLine = startLine.number !== endLine.number;

  if (!selectedText) {
    view.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: '``'
      },
      selection: { anchor: selection.from + 1 }
    });
    view.focus();
    return;
  }

  if (isMultiLine) {
    const beforeSelection = view.state.sliceDoc(Math.max(0, selection.from - 4), selection.from);
    const afterSelection = view.state.sliceDoc(selection.to, Math.min(doc.length, selection.to + 4));

    if (beforeSelection.endsWith('```\n') && afterSelection.startsWith('\n```')) {
      view.dispatch({
        changes: [
          { from: selection.from - 4, to: selection.from, insert: '' },
          { from: selection.to, to: selection.to + 4, insert: '' }
        ],
        selection: { anchor: selection.from - 4, head: selection.to - 4 }
      });
    } else {
      view.dispatch({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: `\`\`\`\n${selectedText}\n\`\`\``
        },
        selection: { anchor: selection.from + 4, head: selection.to + 4 }
      });
    }
  } else {
    const beforeChar = selection.from > 0 ? view.state.sliceDoc(selection.from - 1, selection.from) : '';
    const afterChar = selection.to < doc.length ? view.state.sliceDoc(selection.to, selection.to + 1) : '';

    if (beforeChar === '`' && afterChar === '`') {
      view.dispatch({
        changes: [
          { from: selection.from - 1, to: selection.from, insert: '' },
          { from: selection.to, to: selection.to + 1, insert: '' }
        ],
        selection: { anchor: selection.from - 1, head: selection.to - 1 }
      });
    } else {
      view.dispatch({
        changes: {
          from: selection.from,
          to: selection.to,
          insert: `\`${selectedText}\``
        },
        selection: { anchor: selection.from + 1, head: selection.to + 1 }
      });
    }
  }

  view.focus();
}

export function applyLink(view: EditorView): void {
  const selection = view.state.selection.main;
  const selectedText = view.state.sliceDoc(selection.from, selection.to);

  if (selectedText) {
    view.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: `[${selectedText}](url)`
      },
      selection: { anchor: selection.to + 3, head: selection.to + 6 }
    });
  } else {
    view.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: '[text](url)'
      },
      selection: { anchor: selection.from + 1, head: selection.from + 5 }
    });
  }
  view.focus();
}

export function applyList(view: EditorView): void {
  const selection = view.state.selection.main;
  const line = view.state.doc.lineAt(selection.from);
  const lineText = line.text;

  let newText: string;
  if (lineText.match(/^\d+\.\s/)) {
    newText = lineText.replace(/^\d+\.\s/, '');
  } else if (lineText.startsWith('- ')) {
    newText = lineText.replace(/^- /, '1. ');
  } else {
    newText = '- ' + lineText;
  }

  view.dispatch({
    changes: {
      from: line.from,
      to: line.to,
      insert: newText
    }
  });
  view.focus();
}

export function applyQuote(view: EditorView): void {
  const selection = view.state.selection.main;
  const doc = view.state.doc;

  const startLine = doc.lineAt(selection.from);
  const endLine = doc.lineAt(selection.to);

  const lines: { from: number; to: number; text: string }[] = [];
  for (let i = startLine.number; i <= endLine.number; i++) {
    const line = doc.line(i);
    lines.push({ from: line.from, to: line.to, text: line.text });
  }

  const allQuoted = lines.every(line => line.text.startsWith('> '));

  const changes = lines.map(line => {
    let newText: string;
    if (allQuoted) {
      newText = line.text.replace(/^> /, '');
    } else {
      newText = line.text.startsWith('> ') ? line.text : '> ' + line.text;
    }
    return {
      from: line.from,
      to: line.to,
      insert: newText
    };
  });

  view.dispatch({ changes });
  view.focus();
}

export function applyTable(view: EditorView): void {
  const selection = view.state.selection.main;
  const table = `| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
| Cell 7   | Cell 8   | Cell 9   |
`;

  view.dispatch({
    changes: {
      from: selection.from,
      to: selection.to,
      insert: table
    },
    selection: { anchor: selection.from + table.length }
  });
  view.focus();
}
