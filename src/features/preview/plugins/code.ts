import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import { registerCodeBlockRenderer } from '..';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);

export function initCodePlugin(): void {
  registerCodeBlockRenderer('javascript', (code, language) => {
    const highlighted = hljs.highlight(code, { language: 'javascript' }).value;
    return `<pre class="code-block code-block--dark"><code class="hljs language-${language}">${highlighted}</code></pre>`;
  });

  registerCodeBlockRenderer('typescript', (code, language) => {
    const highlighted = hljs.highlight(code, { language: 'typescript' }).value;
    return `<pre class="code-block code-block--dark"><code class="hljs language-${language}">${highlighted}</code></pre>`;
  });
}
