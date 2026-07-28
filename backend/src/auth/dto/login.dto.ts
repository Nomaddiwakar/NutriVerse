import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Invalid email address provided' })
  @IsNotEmpty({ message: 'Email address must not be empty' })
  email: string;

  @IsNotEmpty({ message: 'Password hash must not be empty' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}

export class OtpSendDto {
  @IsEmail({}, { message: 'Invalid email address provided' })
  @IsNotEmpty({ message: 'Email address target must not be empty' })
  email: string;
}

export class OtpVerifyDto {
  @IsEmail({}, { message: 'Invalid email address provided' })
  @IsNotEmpty({ message: 'Email address target must not be empty' })
  email: string;

  @IsNotEmpty({ message: 'Verification passcode must not be empty' })
  @MinLength(6, { message: 'Passcode must be precisely 6 digits' })
  code: string;
}
