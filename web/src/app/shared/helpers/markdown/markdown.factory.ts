import { MarkedOptions, MarkedRenderer } from "ngx-markdown";
import { marked, Tokens} from 'marked'

export function markedOptionsFactory(): MarkedOptions {
  marked.use({
  renderer: {
    blockquote(this: any, token: Tokens.Blockquote) {
      // 1) Récupérer le texte brut du blockquote
      const text = (token.text || '').trim();

      // 2) Chercher un [!XXX] n'importe où dans le bloc
      const match = text.match(/\[!([A-Z]+)\]/i);

      let cls = '';

      if (match) {
        const type = match[1].toUpperCase();

        switch (type) {
          case 'WARNING':
            cls = 'md-warning';
            break;
          case 'INFO':
            cls = 'md-info';
            break;
          case 'SUCCESS':
            cls = 'md-success';
            break;
          case 'ERROR':
            cls = 'md-error';
            break;
        }
      }

      // 3) HTML généré normalement pour le contenu
      let html = this.parser.parse(token.tokens) as string;

      // 4) Si c'est un bloc spécial, enlever le [!XXX] du HTML
      if (match) {
        // cas 1 : [!WARNING] tout seul dans le premier paragraphe
        html = html.replace(
          /^<p>\s*\[![A-Z]+\]\s*<\/p>\s*/i,
          ''
        );

        // cas 2 : [!WARNING] dans la même ligne qu'un autre texte
        html = html.replace(/\[![A-Z]+\]\s*/i, '');
      }

      return `<blockquote class="${cls}">${html}</blockquote>`;
    },
  },
});

  return { gfm: true };
}