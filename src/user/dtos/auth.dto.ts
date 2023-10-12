import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '@prisma/client';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
  IsEnum,
  IsOptional,
  Length,
} from 'class-validator';

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @Matches(/^(\+?880|0)(1[3-9]|1[5-8]\d|19[0-9])[0-9]{8}$/, {
    message: 'invalid phone number',
  })
  phone: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(5)
  password: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  productKey?: string;
}

export class SigninDto {
  @IsEmail()
  @ApiProperty({
    description: 'The email address of the user.',
    example: 'john.doe@example.com',
    required: true,
  })
  email: string;

  @IsString()
  @Length(5, 15, { message: 'password has to be between 5 & 15 characters' })
  @ApiProperty({
    description: 'The password the user.',
    example: 'asdf1234',
    required: true,
  })
  password: string;
}

export class GenerateProductKeyDto {
  @IsEmail()
  email: string;

  @IsEnum(UserType)
  userType: UserType;
}
