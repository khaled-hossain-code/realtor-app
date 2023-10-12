import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { HomeService } from './home.service';
import { CreateHomeDto, HomeResponseDto, UpdateHomeDto } from './dto/home.Dto';
import { PropertyType } from '@prisma/client';
import { User } from 'src/user/decorators/user.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { TransformInterceptor } from 'src/common/interceptors/transform/transform.interceptor';
import { ApiParam, ApiTags } from '@nestjs/swagger';

@Controller('home')
@ApiTags('Home')
@UseInterceptors(TransformInterceptor)
export class HomeController {
  private readonly logger = new Logger(HomeController.name);
  constructor(private readonly homeService: HomeService) {}

  @Get()
  async getHomes(
    @Query('city') city?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('propertyType') propertyType?: PropertyType,
  ): Promise<HomeResponseDto[]> {
    const price =
      minPrice || maxPrice
        ? {
            ...(minPrice && { gte: parseFloat(minPrice) }),
            ...(maxPrice && { lte: parseFloat(maxPrice) }),
          }
        : undefined;

    const filters = {
      ...(city && { city }),
      ...(price && { price }),
      ...(propertyType && { propertyType }),
    };

    this.logger.log('Hit the get home route');
    const homes = await this.homeService.getHomes(filters);
    this.logger.debug(`Found ${homes.length} homes`);

    return homes;
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Home ID', type: 'number' })
  getHome(@Param('id', ParseIntPipe) id: number) {
    return this.homeService.getHomeById(id);
  }

  @UseGuards(AuthGuard)
  @Post()
  createHome(@Body() body: CreateHomeDto, @User() user) {
    return user;
    return this.homeService.createHome(body, user.id);
  }

  @Put(':id')
  async updateHome(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateHomeDto,
    @User() user,
  ) {
    const realtor = await this.homeService.getRealtorByHomeId(id);

    if (realtor.id !== user?.id) {
      throw new UnauthorizedException();
    }

    return this.homeService.updateHomeById(id, body);
  }

  @Delete(':id')
  async deleteHome(@Param('id', ParseIntPipe) id: number, @User() user) {
    const realtor = await this.homeService.getRealtorByHomeId(id);

    if (realtor.id !== user?.id) {
      throw new UnauthorizedException();
    }

    return this.homeService.deleteHomeById(id);
  }
}
