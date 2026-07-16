export class UserPreferenceDto {
  theme: string;
  language: string;
  fontSize: string;

  reduceAnimations: boolean;
  showReadingTime: boolean;
  showAuthorDetails: boolean;
  hideReadPosts: boolean;

  notifyOnLike: boolean;
  notifyOnContribution: boolean;
  emailNotifications: boolean;
  newsletter: boolean;

  profileVisible: boolean;
  showLikedPosts: boolean;
  showContributions: boolean;
}