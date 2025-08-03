# ✅ Button Types & Icons — Todo List

Cette liste sert à suivre le développement des **types de boutons contextuels** avec leur style, icône et comportement attendus.

---

## 📦 Types de bouton à implémenter

| Type     | Fait ✅ | Icône à utiliser (otpionnel)      | Comportement |
|----------|--------|------------------------|--------------|
| ✅ Submit   | [ ]    | `send`, `check`         | Soumission de formulaire |
| ✅ Success  | [ ]    | `check-circle`, `tick`  | Action réussie, confirmation |
| ⚠️ Warning  | [ ]    | `alert-triangle`, `warning` | Action risquée, mais pas critique |
| ❌ Danger   | [ ]    | `trash`, `x-circle`     | Suppression, erreur, action irréversible |
| ℹ️ Info     | [ ]    | `info`, `help-circle`   | Information ou aide contextuelle |

---

## 📐 Options à gérer par type

- [ ] Couleur de fond spécifique
- [ ] Couleur du texte adaptée
- [ ] Hover / Focus / Active
- [ ] Variante `outline`
- [ ] Variante `ghost`
- [ ] Version `disabled`
- [ ] Icône seule
- [ ] Texte + icône
- [ ] Loading spinner avec icône masquée

---

## 🎯 À intégrer

- [ ] Icônes via bibliothèque (`lucide`, `material-icons`, etc.)
- [ ] Classes CSS par type (`btn--success`, `btn--danger`, etc.)
- [ ] Signal `[type]` pour changement dynamique
- [ ] Accessibilité (`aria-label`, focus visible)

---

## 📄 Exemple d’usage cible

```html
<app-button
  type="success"
  label="Valider"
  icon="check-circle"
></app-button>

<app-button
  type="danger"
  icon="trash"
  [loading]="isDeleting"
></app-button>
