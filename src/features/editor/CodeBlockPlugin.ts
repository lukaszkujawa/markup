import { EditorView, Decoration, ViewPlugin, DecorationSet, ViewUpdate } from '@codemirror/view';
import { Range } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';

export const codeBlockPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  buildDecorations(view: EditorView): DecorationSet {
    const decorations: Range<Decoration>[] = [];
    const tree = syntaxTree(view.state);

    tree.iterate({
      enter: (node) => {
        if (node.name === 'FencedCode') {
          const from = node.from;
          const to = node.to;

          const doc = view.state.doc;
          let pos = from;

          while (pos <= to) {
            const line = doc.lineAt(pos);
            if (line.from >= from && line.to <= to) {
              decorations.push(
                Decoration.line({ class: 'cm-code-block-line' }).range(line.from)
              );
            }
            if (line.to >= to) break;
            pos = line.to + 1;
          }
        }
      }
    });

    return Decoration.set(decorations, true);
  }
}, {
  decorations: v => v.decorations
});
