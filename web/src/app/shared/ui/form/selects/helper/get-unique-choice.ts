export function getUniqueChoice(choices: string[] = []) {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  choices.forEach((choice) => {
    if (seen.has(choice)) {
      duplicates.push(choice);
    }
    seen.add(choice);
  });

  if (duplicates.length > 0) {
    console.warn(
      `Attention: La liste "choices"(${choices}) contient des doublons (${duplicates}), ceux-ci sont dont supprimer`
    );
  }

  return [...seen];
}
