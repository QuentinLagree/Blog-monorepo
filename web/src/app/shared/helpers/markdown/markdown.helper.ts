import { Component, ElementRef } from "@angular/core";
import { MarkdownSyntax } from "../../ui/context-menu/types/markdownOptions.interface";
import { TextAreaComponent } from "../../ui/form/text-area/text-area";
import { MarkdownSyntaxOptions } from "../../ui/context-menu/config/context-menu-options";

type MarkdownLineType = "blocquote" | "list" | "number-list" | "tasklist"

export const MarkdownHelper = (markdown_editor: ElementRef) => {
    console.log(markdown_editor.nativeElement)
}

export const getSyntaxSelection = (syntax: string, caraceter: string = '$'): number => {
    return syntax.indexOf(caraceter) + 1;
}

function getEndOfSelectedLine(textarea: HTMLTextAreaElement) {
    const value = textarea.value;
    const pos = textarea.selectionStart;

    const lineStart = value.lastIndexOf("\n", pos - 1) + 1;

    let lineEnd = value.indexOf("\n", pos);
    console.log("LIgne : " + textarea.value.substring(lineStart, lineEnd))
    if (lineEnd === -1) lineEnd = value.length;

    return lineEnd - 1;
}

export const getSelectedLine = (textarea: HTMLTextAreaElement): string => {
  const value = textarea.value;
  const pos = textarea.selectionStart;

  const lineStart = value.lastIndexOf("\n", pos - 2) + 1;

  let lineEnd = value.indexOf("\n", pos - 1);
  if (lineEnd === -1) lineEnd = value.length;

  return value.substring(lineStart, lineEnd);
}

export const applyMarkdownSyntax = (
  item: MarkdownSyntax,
  component: TextAreaComponent
) => {
  const textarea = component.textareaComponent()?.nativeElement;

  if (!textarea) {
    throw new Error("Erreur: Le champs 'textarea' est introuvable ou n'existe pas!");
  }

  // Si syntaxe de type bloc, on se place à la fin de la ligne
  if (item.bloc) {
    const endOfLine = getEndOfSelectedLine(textarea) + 1;
    textarea.setSelectionRange(endOfLine, endOfLine);
    textarea.focus();
  }

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  const hasSelection = start !== end;

  const placeholderIndex = item.syntax.indexOf('$');
  const syntaxWithoutPlaceholder = item.syntax.replace('$', '');

  const selectedText = hasSelection
    ? textarea.value.slice(start, end)
    : '';

  const insertedSyntax = item.syntax.replace('$', selectedText);

  const prefix = textarea.value.slice(0, start);
  const suffix = textarea.value.slice(end);

  const nextValue =
    prefix +
    (item.bloc ? '\n' : '') +
    insertedSyntax +
    suffix;

  component.control.setValue(nextValue);

  // Calcul précis du curseur
  const caretOffset =
    placeholderIndex !== -1
      ? placeholderIndex + (hasSelection ? selectedText.length : 0)
      : insertedSyntax.length;

  const nextCaret = start + (item.bloc ? 1 : 0) + caretOffset;

  textarea.setSelectionRange(nextCaret, nextCaret);
  textarea.focus();

  component.control.markAsDirty();
};


export const setNewLineWithSyntax = (
  textarea: HTMLTextAreaElement,
  component: TextAreaComponent
) => {
  if (!textarea) {
    throw new Error("Erreur: Le champs 'textarea' est introuvable ou n'existe pas!");
  }

  const selectedLine = getSelectedLine(textarea);
  if (!selectedLine) return;

  const detected = detectMarkdownLineType(selectedLine);
  if (!detected) return;

  const syntaxDef = MarkdownSyntaxOptions.find(o => o.name === detected.type);
  if (!syntaxDef) return;

  // Si la ligne contient déjà uniquement la syntaxe (ex: "# "), on ne fait rien
  const syntaxWithoutPlaceholder = syntaxDef.syntax.replace('$', '');
  const syntaxAsLine = syntaxDef.syntax.replace('$', ' ');
  if (syntaxAsLine.length === selectedLine.length) return;

  const insertAt = textarea.selectionStart;

  const nextValue =
    textarea.value.slice(0, insertAt) +
    syntaxWithoutPlaceholder +
    textarea.value.slice(insertAt);

  component.control.setValue(nextValue);

  // Place le curseur à l'endroit du "$" (ou en fin de syntaxe si pas de placeholder)
  const caretOffset = syntaxDef.syntax.includes('$')
    ? syntaxDef.syntax.indexOf('$')
    : syntaxWithoutPlaceholder.length;

  const nextCaret = insertAt + caretOffset;

  textarea.setSelectionRange(nextCaret, nextCaret);
  textarea.focus();

  component.control.markAsDirty(); // markAllAsDirty() est souvent trop agressif
};

  function detectMarkdownLineType(line: string): { type: MarkdownLineType; text: string } | null {
  const regex = /^(?<marker>>|- \[\s*\]|-|1\.)\s+(?<text>.+)$/;
  const match = line.match(regex);

  if (!match || !match.groups) return null;

  const marker = match.groups["marker"];
  const text   = match.groups["text"];

  let type: MarkdownLineType;

  switch (true) {
    case marker === ">":
      type = "blocquote";
      break;
    case marker === "-":
      type = "list";
      break;
    case marker === "1.":
      type = "number-list";
      break;
    case marker.startsWith("- ["):
      type = "tasklist";
      break;
    default:
      return null;
  }

  return { type, text };
}

export function generateSyntaxList () { 
  const syntaxesItem = MarkdownSyntaxOptions
  for (const syntax of syntaxesItem) {
    
  }
}