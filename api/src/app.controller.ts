import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  UseInterceptors,
} from '@nestjs/common';
import { UserEntity } from './modules/user/entities/user.entities';
import { TransformDataInterceptor } from './commons/interceptors/transform_data.interceptor';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Racine')
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(new TransformDataInterceptor(UserEntity))
@Controller()
export class AppController {
  @Get()
  main() {
    return 'Main Page';
  }
}
