import { Component, ElementRef, EventEmitter, Output, viewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TextAreaConfig } from './models/textarea-validation-context';
import { InputErrorComponent } from '../inputs/inputs-error/inputs-error';
import { BaseFormElementComponent } from '../inputs/base-input';
import { MarkdownSyntax } from '../../context-menu/types/markdownOptions.interface';
import { applyMarkdownSyntax, getSelectedLine, getSyntaxSelection, setNewLineWithSyntax } from '@src/app/shared/helpers/markdown/markdown.helper';
import { MarkdownSyntaxOptions } from '../../context-menu/config/context-menu-options';

@Component({
  selector: 'app-textarea',
  imports: [ReactiveFormsModule, InputErrorComponent],
  templateUrl: './text-area.html',
  styleUrls: ['./text-area.scss'],
  standalone: true
})
export class TextAreaComponent extends BaseFormElementComponent<TextAreaConfig> {

  textareaComponent = viewChild<ElementRef<HTMLTextAreaElement>>('textarea');
  @Output()
  scrolled = new EventEmitter<number>(); // scrollTop

  override defaultConfiguration: TextAreaConfig = {
    label: 'Text',
    placeholder: 'placeholder : text',
    required: true,
  };

  markdownSetNewLine () {
    const textarea = this.textareaComponent()?.nativeElement;
    if (!textarea) throw new Error("Erreur: Le champs 'textarea' est introuvable ou n'existe pas!")
    setNewLineWithSyntax(textarea, this)
  } 

  applySyntax(item: MarkdownSyntax) {
    applyMarkdownSyntax(item, this)
  }

  onScroll() {
    const el = this.textareaComponent()?.nativeElement;
    if (!el) return;
    this.scrolled.emit(el.scrollTop);
  }

  getElement (): ElementRef<HTMLTextAreaElement> | null {
    return this.textareaComponent() ?? null;
  }
}
