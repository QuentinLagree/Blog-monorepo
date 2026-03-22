export type PostFormState = 'TITLE' | 'DESCRIPTION' | 'CONTENT' | 'SUBMIT';

export const POST_FORM_STATES: PostFormState[] = ['TITLE', 'DESCRIPTION', 'CONTENT', 'SUBMIT'];

export function nextState(current: PostFormState): PostFormState {
  const i = POST_FORM_STATES.indexOf(current);
  return POST_FORM_STATES[Math.min(i + 1, POST_FORM_STATES.length - 1)];
}

export function prevState(current: PostFormState): PostFormState {
  const i = POST_FORM_STATES.indexOf(current);
  console.log(POST_FORM_STATES[Math.max(i - 1, 0)])
  return POST_FORM_STATES[Math.max(i - 1, 0)];
}
