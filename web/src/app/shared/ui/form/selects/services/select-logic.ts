export const formatKebab = (s: string) => (s ?? '').trim().toLowerCase().replaceAll(' ', '-');

export const validateDefaultChoice = (
  choices: string[],
  def?: string
): string => {
  if (!def) return '';
  return choices.includes(def)
    ? ''
    : `Erreur: Le 'default_choice' (${def}) doit être défini dans 'choices' (${choices}).`;
};

export const filterChoices = (choices: string[], q: string) => {
  const v = (q ?? '').toLowerCase();
  return choices.filter(c => c.toLowerCase().includes(v));
};

// (Optionnel) stratégie de formatage si tu veux ouvrir/fermer (OCP)
export interface SelectFormatStrategy { format(v: string): string; }
export const kebabFormatStrategy: SelectFormatStrategy = { format: formatKebab };

export const computeAvailableChoices = (all: string[], selected: string[]) => {
  return all.filter(c => !selected.includes(c));
}