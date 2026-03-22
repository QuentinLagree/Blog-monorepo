import { MarkdownSyntax } from "../types/markdownOptions.interface";

export const MarkdownSyntaxOptions: MarkdownSyntax[] = [
  {
    name: "h1",
    display: "Titre niveau 1",
    syntax: "# $"
    , bloc: true
  },
  {
    name: "h2",
    display: "Titre niveau 2",
    syntax: "## $"
    , bloc: true
  },
  {
    name: "h3",
    display: "Titre niveau 3",
    syntax: "### $"
    , bloc: true
  },
  {
    name: "h4",
    display: "Titre niveau 4",
    syntax: "#### $"
    , bloc: true
  },
  {
    name: "h5",
    display: "Titre niveau 5",
    syntax: "##### $"
    , bloc: true
  },
  {
    name: "h6",
    display: "Titre niveau 6",
    syntax: "###### $"
    , bloc: true
  },
  {
    name: "bold",
    display: "Texte en gras",
    syntax: "**$**"
    , bloc: false
  },
  {
    name: "italic",
    display: "Texte en italique",
    syntax: "*$*"
    , bloc: false
  },
  {
    name: "bold+italic",
    display: "Texte en gras + italique",
    syntax: "***$***"
    , bloc: false
  },
  {
    name: "lined-text",
    display: "Texte barré",
    syntax: "~~$~~"
    , bloc: false
  },
  {
    name: "inline-code",
    display: "Code inline",
    syntax: "`$`"
    , bloc: false
  },
  {
    name: "bloc-code",
    display: "Bloc de code",
    syntax: "```\n$\n```"
    , bloc: true
  },
  {
    name: "blocquote",
    display: "Bloc de citation",
    syntax: "> $"
    , bloc: true
    , repeatOnEnter: true
  },
  {
    name: "list",
    display: "Liste à puces",
    syntax: "- $"
    , bloc: true
    , repeatOnEnter: true
  },
  {
    name: "number-list",
    display: "Liste numérotée",
    syntax: "1. $"
    , bloc: true
    , repeatOnEnter: true
  },
  {
    name: "list inside",
    display: "Liste imbriquée",
    syntax: "- élément\n  - $"
    , bloc: true
  },
  {
    name: "link",
    display: "Insérer un lien",
    syntax: "[$](url)"
    , bloc: false
  },
  {
    name: "image",
    display: "Insérer une image",
    syntax: "![$](url)"
    , bloc: false
  },
  {
    name: "separated",
    display: "Ligne de séparation",
    syntax: "---"
    , bloc: true
  },
  {
    name: "table",
    display: "Créer un tableau",
    syntax: "| $ | |\n|---|---|\n|  |  |"
    , bloc: true
  },
  {
    name: "tasklist",
    display: "Liste de tâches",
    syntax: "- [ ] $"
    , bloc: true
    , repeatOnEnter: true
  },
  {
    name: "bloc-warn",
    display: "Bloc d'avertissement",
    syntax: "> [!WARNING]\n> $"
    , bloc: true
  },
  {
    name: "bloc-info",
    display: "Bloc d'information",
    syntax: "> [!INFO]\n> $"
    , bloc: true
  },
  {
    name: "bloc-success",
    display: "Bloc de succès",
    syntax: "> [!SUCCESS]\n> $"
    , bloc: true
  },
  {
    name: "bloc-error",
    display: "Bloc d'erreur",
    syntax: "> [!ERROR]\n> $"
    , bloc: true
  }
]
