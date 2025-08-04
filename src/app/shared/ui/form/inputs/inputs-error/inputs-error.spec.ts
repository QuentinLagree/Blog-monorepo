import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { InputErrorComponent } from './inputs-error';

describe('InputErrorComponent', () => {
  let component: InputErrorComponent;
  let fixture: ComponentFixture<InputErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, InputErrorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(InputErrorComponent);
    component = fixture.componentInstance;
    component.control = new FormControl('');
    fixture.detectChanges();
  });

  it('should create a thruly instance of Component', () => {
    expect(component).toBeTruthy();
  });

  it('Should display an error message if fields is wrong or touched', () => {
    const control = new FormControl('', Validators.required);
    control.markAsTouched();
    component.control = control;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent?.trim()).toBe('Ce champ est requis');
  });

  it('Should display an error message if fields value is less than minLength', () => {
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    const minLength: number = 6;
    const control = new FormControl('abc', Validators.minLength(minLength));
    control.markAsTouched();
    component.control = control;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent?.trim()).toBe(
      `Le texte doit contenir au moins ${minLength} caractère${minLength == 1 ? '' : 's'} (actuellement ${control.value?.length}).`
    );
  });

  it('Should display an error message if fields value is less than maxLength', () => {
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    const maxLength: number = 10;
    const control = new FormControl('abcabcbcabcabc', Validators.maxLength(maxLength));
    control.markAsTouched();
    component.control = control;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent?.trim()).toBe(
      `Le texte ne doit pas dépasser ${maxLength} caractère${maxLength == 1 ? '' : 's'} (actuellement ${control.value?.length}).`
    );
  });

  it('Should display an error message if fields are an error unexcepted', () => {
    const control = new FormControl('abcabcbcabcabc', {
      validators: [() => ({ unexceptedError: true })]
    });
    control.markAsTouched();
    component.control = control;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent?.trim()).toBe(`Champ invalide`);
  });
});
