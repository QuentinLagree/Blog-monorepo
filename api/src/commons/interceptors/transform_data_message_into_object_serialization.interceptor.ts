import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { map } from 'rxjs/internal/operators/map';
import { Observable } from 'rxjs/internal/Observable';

@Injectable()
export class TransformDataMessageIntoObjectSerialization
  implements NestInterceptor
{
  constructor(
    private readonly targetClasses: (new (...args: any[]) => any)[],
  ) {}

  private pickTargetClass(data: any): new (...args: any[]) => any {
    if (!data) return this.targetClasses[0];
    // Heuristique simple : selon la présence de propriétés caractéristiques
    for (const cls of this.targetClasses) {
      const instance = new cls({});
      // Compare les propriétés de l'instance et des données
      const keys = Object.keys(instance);
      if (keys.some((key) => key in data)) {
        return cls;
      }
    }
    // Fallback
    return this.targetClasses[0];
  }

  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((response) => {
        if (response && response.data) {
          if (Array.isArray(response.data) && response.data.length > 0) {
            const targetClass = this.pickTargetClass(response.data[0]);
            response.data = plainToInstance(targetClass, response.data);
          } else {
            const targetClass = this.pickTargetClass(response.data);
            response.data = plainToInstance(targetClass, response.data);
          }
        }
        return response;
      }),
    );
  }
}
