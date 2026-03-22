import Prism from 'prismjs';

// 1) Bases nécessaires au templating
import 'prismjs/components/prism-markup';             // HTML
import 'prismjs/components/prism-markup-templating';  // requis pour PHP templates

// 2) Base “clike” pour Java/PHP/etc.
import 'prismjs/components/prism-clike';

// 3) Langages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-php';

// (optionnel) alias si besoin
(Prism.languages as any).ts = Prism.languages.typescript;
(Prism.languages as any).py = Prism.languages.python;

export default Prism;
