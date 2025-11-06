import { ClassConstructor, plainToInstance } from 'class-transformer';
import { ValidationError, validate } from 'class-validator';
import { dtoClasses } from 'src/commons/types/dto-types';
import { UserDto } from 'src/modules/user/dto/user.dto';

export const dtoIsValid = async (
  dto: dtoClasses,
  tagetDto: ClassConstructor<dtoClasses> = UserDto,
): Promise<ValidationError[]> => {
  const errors: ValidationError[] = await validate(
    plainToInstance(tagetDto, dto),
  );
  return errors;
};
