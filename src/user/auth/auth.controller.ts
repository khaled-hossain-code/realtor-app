import {
  Body,
  Controller,
  Get,
  HttpException,
  NotFoundException,
  Param,
  ParseEnumPipe,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GenerateProductKeyDto, SigninDto, SignupDto } from '../dtos/auth.dto';
import { UserType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { User } from '../decorators/user.decorator';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  async handleGoogleSignIn(@Body() body: { accessToken: string }) {
    const googleApiUrl = 'https://www.googleapis.com/oauth2/v3/tokeninfo';

    const response = await fetch(
      `${googleApiUrl}?access_token=${body.accessToken}`,
    );

    const userData = await response.json();

    // Use userData in your application
    console.log('User data from Google:', userData);

    // You can perform additional actions, such as creating a user in your database

    return { message: 'Google Sign-In handled successfully' };
  }

  @Post('/signup/:userType')
  async signup(
    @Body() body: SignupDto,
    @Param('userType', new ParseEnumPipe(UserType)) userType: UserType,
  ) {
    if (userType !== UserType.BUYER) {
      if (!body.productKey) {
        throw new HttpException('product key is required', 400);
      }

      const validProductString = `${body.email}-${userType}-${process.env.PRODUCT_KEY_SECRET}`;

      const isValidProductKey = await bcrypt.compare(
        validProductString,
        body.productKey,
      );

      if (!isValidProductKey) {
        throw new HttpException('invalid product key', 400);
      }
    }
    return this.authService.signup(body, userType);
  }

  @Post('/signin')
  @ApiResponse({
    status: 200,
    description: 'User signed in successfully',
  })
  @ApiForbiddenResponse({
    description: 'User is forbidden',
  })
  signin(@Body() body: SigninDto) {
    return this.authService.signin(body);
  }

  @Post('/key')
  generateProductKey(@Body() { email, userType }: GenerateProductKeyDto) {
    return this.authService.generateProductKey(email, userType);
  }

  @Get('/me')
  @ApiBearerAuth()
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token',
    required: true,
    schema: {
      type: 'string',
      default: 'Bearer ',
    },
  })
  me(@User() user) {
    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }
}
