export function computeDirection(main_component_rect: DOMRect, panel_heigth = 240) {
  const viewport_height = window.innerHeight;
  const spaceBelow = viewport_height - (main_component_rect.bottom + 15);
  const spaceAbove = main_component_rect.top - panel_heigth;

  // Ouvre en haut si pas assez d’espace en bas ET plus d’espace en haut
  return spaceBelow < panel_heigth + 50 && spaceAbove > spaceBelow;
}
