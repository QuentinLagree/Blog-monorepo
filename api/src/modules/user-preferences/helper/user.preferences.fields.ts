export const USER_PREFERENCE_FIELDS = [
  'theme',
  'language',
  'fontSize',
  'reduceAnimations',
  'showReadingTime',
  'showAuthorDetails',
  'hideReadPosts',
  'notifyOnLike',
  'notifyOnContribution',
  'emailNotifications',
  'newsletter',
  'profileVisible',
  'showLikedPosts',
  'showContributions',
] as const;

export type UserPreferenceField =
  (typeof USER_PREFERENCE_FIELDS)[number];