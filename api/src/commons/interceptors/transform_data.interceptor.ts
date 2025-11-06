import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { map } from 'rxjs';

@Injectable()
export class TransformDataInterceptor implements NestInterceptor {
  constructor(private readonly classToUse: ClassConstructor<unknown>) {}

  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => {
        return plainToInstance(this.classToUse, data);
      }),
    );
  }
}
