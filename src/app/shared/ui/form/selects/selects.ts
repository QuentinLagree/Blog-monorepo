import { Component, ElementRef, HostListener, OnInit, QueryList, signal, ViewChild, ViewChildren, WritableSignal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { BaseFormElementComponent } from '../inputs/base-input';
import { SelectConfig } from './models/select-config';
import { InputErrorComponent } from '../inputs/inputs-error/inputs-error';
import { PillsComponent } from '../../utils/pills/pills';

import { getUniqueChoice } from './helper/get-unique-choice';
import { computeDirection } from './helper/viewport-change-to-set-position';
import { setIsOpenOutFocus } from './helper/on-focus-out';
import { validateDefaultChoice, formatKebab, filterChoices, computeAvailableChoices } from './services/select-logic';

@Component({
  selector: 'app-select',
  templateUrl: './selects.html',
  styleUrls: ['./selects.scss'],
  imports: [ReactiveFormsModule, InputErrorComponent, PillsComponent]
})
export class SelectComponent extends BaseFormElementComponent<SelectConfig> implements OnInit {
  @ViewChild('main_component', { static: false }) triggerRef!: ElementRef<HTMLElement>;   // ancien main_component
  @ViewChild('panel') panelRef?: ElementRef<HTMLElement>;                                  // ancien panel
  @ViewChild('filter') searchInputRef?: ElementRef<HTMLInputElement>;                      // ancien filter

  @ViewChildren('optionRef') optionRefs!: QueryList<ElementRef<HTMLElement>>;


  activeIndex = 0;


  status: WritableSignal<'loading' | 'ready' | 'error'> = signal<'loading' | 'ready' | 'error'>('loading'); // ancien state
  errorMessage = '';                                                                                         // ancien errorMessageComponent

  isDropdownOpen = false;                                                                                    // ancien isOpen
  opensUpward = false;                                                                                       // ancien openUp

  uniqueChoices: string[] = [];
  rawSelectedValue: string | string[] = '';                                                                  // ancien valueWithoutFormat
  filteredAvailableChoices: string[] = [];                                                                   // ancien choiceFilter

  selectedValues: string[] = [];                                                                             // ancien values

  override defaultConfiguration: SelectConfig = {
    label: 'Label',
    placeholder: 'Choisissez une valeur.',
    type: 'select',
    choices: ['Valeur par défaut'],
    default_choice: '',
    required: true,
    multiple: false,
  };

  onFocusOut(event: FocusEvent) {
    this.isDropdownOpen = setIsOpenOutFocus(event) ?? this.isDropdownOpen;
    this.control.markAsTouched()
  }

  toggle(open?: boolean) {
    this.isDropdownOpen = open ?? !this.isDropdownOpen;
    if (!this.isDropdownOpen) return;

    if (this.searchInputRef) this.searchInputRef.nativeElement.value = '';
    this.filteredAvailableChoices = this.uniqueChoices;

    const triggerRect = this.triggerRef.nativeElement.getBoundingClientRect();
    const panelHeight = this.panelRef?.nativeElement.getBoundingClientRect().height ?? 240;
    this.opensUpward = computeDirection(triggerRect, panelHeight);
  }

  ngOnInit(): void {
    const config = this.mergeConfigs();

    this.uniqueChoices = getUniqueChoice(config.choices);
    this.filteredAvailableChoices = this.uniqueChoices;

    const defaultChoice = config.default_choice;
    const validationMessage = validateDefaultChoice(this.uniqueChoices, defaultChoice);

    if (validationMessage) {
      this.errorMessage = validationMessage;
      this.status.set('error');
      return;
    }

    this.status.set('ready');
    if (defaultChoice) {
      this.rawSelectedValue = defaultChoice;
      this.control.setValue(formatKebab(defaultChoice ?? ''));
    }
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  onViewportChange() {
    if (!this.isDropdownOpen) return;

    const triggerRect = this.triggerRef.nativeElement.getBoundingClientRect();
    const panelHeight = this.panelRef?.nativeElement.getBoundingClientRect().height ?? 240;
    this.opensUpward = computeDirection(triggerRect, panelHeight);
  }

  updateValue(optionEl: HTMLLIElement) {
    if (this.control.errors && this.control.errors['maxcount-multi-select']) {
        return;
      }
    
    const selectedText = optionEl.innerText.trim();
    const { multiple } = this.mergeConfigs();

    if (multiple === true) {
      if (!this.selectedValues.includes(selectedText)) {
        this.selectedValues = [...this.selectedValues, selectedText];
      }

      let available = computeAvailableChoices(this.uniqueChoices, this.selectedValues);

      const query = this.searchInputRef?.nativeElement.value ?? '';
      if (query) available = available.filter(c => c.toLowerCase().includes(query.toLowerCase()));

      this.filteredAvailableChoices = available;
      this.control.setValue(this.selectedValues)
      this.control.markAsTouched()
      
      this.rawSelectedValue = this.selectedValues;
    } else {
      this.control.setValue(formatKebab(selectedText));
      this.rawSelectedValue = selectedText;

    }
    
  }

  updateFilter(query: string) {
    const availableBase = computeAvailableChoices(this.uniqueChoices, this.selectedValues);
    this.filteredAvailableChoices = filterChoices(availableBase, query);
  }

  deleteChoice(valueToRemove: string, event: Event) {
    if (!this.isDropdownOpen || this.selectedValues.length === 0) return;
    event.preventDefault();
    event.stopPropagation();

    const nextSelectedValues = this.selectedValues.filter(v => v !== valueToRemove);
    this.selectedValues = nextSelectedValues;
    this.rawSelectedValue = nextSelectedValues.length ? nextSelectedValues : '';

    let available = computeAvailableChoices(this.uniqueChoices, nextSelectedValues);

    const query = this.searchInputRef?.nativeElement.value ?? '';
    if (query) available = available.filter(c => c.toLowerCase().includes(query.toLowerCase()));

    this.filteredAvailableChoices = available;
    this.isDropdownOpen = true;
    this.control.setValue(this.selectedValues)

  }

  getFormattedChoice(text: string) {
    return formatKebab(text);
  }

  private focusOption(index: number) {
    const items = this.optionRefs?.toArray() ?? [];
    if (!items.length) return;
    const max = items.length - 1;
    this.activeIndex = Math.max(0, Math.min(index, max));
    items[this.activeIndex]?.nativeElement.focus();
  }

  private focusFirst() { this.focusOption(0); }
  private focusLast() { const n = this.optionRefs.length; if (n) this.focusOption(n - 1); }
  private focusNext() { this.focusOption(this.activeIndex + 1); }
  private focusPrev() { this.focusOption(this.activeIndex - 1); }

  onListKeydown(e: KeyboardEvent) {
    if (!this.isDropdownOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        this.isDropdownOpen = true
        e.preventDefault(); this.focusNext(); break;
      case 'ArrowUp':
        this.isDropdownOpen = true
        e.preventDefault(); this.focusPrev(); break;
      case 'Home':
        this.isDropdownOpen = true
        e.preventDefault(); this.focusFirst(); break;
      case 'End':
        this.isDropdownOpen = true
        e.preventDefault(); this.focusLast(); break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        // Sélectionne l’élément actif
        const el = this.optionRefs.get(this.activeIndex)?.nativeElement as HTMLLIElement | undefined;
        if (el) this.updateValue(el);
        break;
      case 'Escape':
        e.preventDefault();
        this.isDropdownOpen = false;
        // (optionnel) rendre le focus au trigger
        this.triggerRef?.nativeElement.focus();
        break;

      default: 
        this.searchInputRef?.nativeElement.focus();
    }
  }

}

