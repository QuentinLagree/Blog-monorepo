import { AbstractControl } from '@angular/forms';

export function GetInputErrorMessage(control: AbstractControl): string | null {
  if (!control) return null;

  if (!control?.errors || (!control.touched && !control.dirty)) return null;

  const errors = control.errors;

  if (errors?.['required-multi-select']) {
    return 'Une option minimum est requise.';
  }

  if (errors?.['required-select']) {
    return "La séléction d'une option est requise.";
  }

  if (errors?.['required']) {
    return 'Ce champ est requis';
  }

  if (errors?.['minlength']) {
    const { requiredLength, actualLength } = errors['minlength'];
    return `Le texte doit contenir au moins ${requiredLength} caractère${requiredLength == 1 ? '' : 's'} (actuellement ${actualLength}).`;
  }

  if (errors?.['maxcount-multi-select']) {
    const { requiredLength } = errors['maxcount-multi-select'];
    return `Vous ne pouvez pas séléctionner plus de ${requiredLength} éléments dans la liste.`;
  }

  if (errors?.['maxlength']) {
    const { requiredLength, actualLength } = errors['maxlength'];
    return `Le texte ne doit pas dépasser ${requiredLength} caractère${requiredLength == 1 ? '' : 's'} (actuellement ${actualLength}).`;
  }

  if (errors?.['email']) {
    return "L'email saisi n'est pas valide. (exemple@gmail.com)";
  }

  if (errors?.['tooWeak']) {
    return `Le mot de passe est trop faible. Veuillez le rendre plus complexe.`;
  }

  if (errors?.['disabledSpecialCaracter']) {
    return `Les caractères spéciaux ne sont pas valide dans ce champ.`;
  }

  if (errors?.['PasswordNotMatch']) {
    return `Les deux mots de passes doivent correspondre.`;
  }

  return 'Champ invalide';
}
