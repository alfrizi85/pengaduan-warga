import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username hanya boleh berisi huruf, angka, dan underscore.',
  })
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password harus mengandung minimal satu huruf dan satu angka.',
  })
  password: string;
}
