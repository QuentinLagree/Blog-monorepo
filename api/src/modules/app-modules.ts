import { AuthModule } from "./auth/auth.module";
import { PasswordRecoveryModule } from "./handle-password/password_recovery.module";
import { PostsModule } from "./post/posts.module";
import { UserModule } from "./user/user.module";

export const moduleModules = [
    UserModule,
    AuthModule,
    PasswordRecoveryModule,
    PostsModule,
]