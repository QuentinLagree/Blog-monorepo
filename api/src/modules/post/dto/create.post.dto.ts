import {
  IsDefined,
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';

export class CreatePostDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Length(5, 85)
  title: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  description: string;
}