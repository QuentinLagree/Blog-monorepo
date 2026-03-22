import { UserLoginCredentials } from 'src/modules/auth/dto/user-login-credentials.dto';
import { UserPasswordFields } from 'src/modules/handle-password/dto/passwords-fields.dto';
import { UserEmail } from 'src/modules/handle-password/dto/user-email.dto';
import { CreatePostDto } from 'src/modules/post/dto/create-post.dto';
import { UserUpdateDto } from 'src/modules/user/dto/update-user.dto';
import { UserDto } from 'src/modules/user/dto/user.dto';

export type dtoClasses =
  | UserDto
  | UserUpdateDto
  | UserLoginCredentials
  | UserEmail
  | UserPasswordFields
  | CreatePostDto;
