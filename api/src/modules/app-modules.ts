import { AuthModule } from './auth/auth.module';
import { PasswordRecoveryModule } from './handle-password/password_recovery.module';
import { PostsModule } from './post/posts.module';
import { UserPreferencesModule } from './user-preferences/user-preferences.module';
import { UserPostsModule } from './user/user-activities/user-activities.module';
import { UserModule } from './user/user.module';

export const moduleModules = [
  UserModule,
  PostsModule,
  UserPostsModule,
  AuthModule,
  PasswordRecoveryModule,
  UserPreferencesModule,
];