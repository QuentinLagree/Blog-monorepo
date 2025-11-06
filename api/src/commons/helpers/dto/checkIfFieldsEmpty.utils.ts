import { ClassConstructor } from 'class-transformer';
import { ValidationError } from 'class-validator';
import { isFieldsInvalid } from '../error.helper';
import { dtoIsValid } from './dto-validations.helper';
import { dtoClasses } from 'src/commons/types/dto-types';

export const checkFieldIsEmpty = async (
  dto: dtoClasses,
  targetDto: ClassConstructor<dtoClasses>,
) => {
  const errors: ValidationError[] = await dtoIsValid(dto, targetDto);

  if (errors.length > 0) throw new isFieldsInvalid(errors);
};
