import {
  Body,
  Controller,
  Get,
  HttpException,
  NotFoundException,
  Param,
  ParseEnumPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GenerateProductKeyDto, SignupDto } from '../dtos/auth.dto';
import { UserType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { User } from '../decorators/user.decorator';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiHeader,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  async handleGoogleSignIn(@Body() body: { accessToken: string }) {
    const payload = {
      google_id: '116377077107995107922',
      provider: 'google',
      name: 'Md Khaled Hossain',
      email: 'md.khaled.eee@gmail.com',
      image:
        'https://lh3.googleusercontent.com/a/ACg8ocKEz8w0a9hIrKVoS87W7Twr3zCIw6Eu2wj8798Qe7h6ZoA=s96-c',
      access_token:
        'ya29.a0AfB_byBV19xNr4Xpm6N6YOPvqJa91aCoY1XW57pjCVOSI-mMID6dbaBV2detnRVIq9igmulZY2v8dHG6Tor8-jCNjnoDuEHmn49Deygvm9XZhFeutRwAc7hXUIdJiZFtDLQybUEgdlfYMWOgC5yaOmP2gtAQeoe9Lye6aCgYKAVkSARISFQGOcNnC8YAF8z7H9sz4Qji-rpIO4A0171',
    };
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

  @Post('/login')
  @UseGuards(LocalAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'User signed in successfully',
  })
  @ApiForbiddenResponse({
    description: 'User is forbidden',
  })
  login(@Request() { user }) {
    return {
      userId: user.id,
      token: this.authService.generateJWT(user.id, user.name),
    };
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
  @UseGuards(JwtAuthGuard)
  me(@User() user) {
    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }
}
