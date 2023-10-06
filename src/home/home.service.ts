import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { HomeResponseDto } from './dto/home.Dto';
import { PropertyType } from '@prisma/client';

interface GetHomesParams {
  city?: string;
  price?: {
    gte?: number;
    lte?: number;
  };
  propertyType: PropertyType;
}

interface CreateHomeParams {
  address: string;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  city: string;
  price: number;
  landSize: number;
  propertyType: PropertyType;
  images: { url: string }[];
}

@Injectable()
export class HomeService {
  constructor(private readonly prismaService: PrismaService) {}

  async getHomes(params: GetHomesParams): Promise<HomeResponseDto[]> {
    const homes = await this.prismaService.home.findMany({
      select: {
        id: true,
        address: true,
        number_of_bedrooms: true,
        number_of_bathrooms: true,
        city: true,
        listed_date: true,
        price: true,
        propertyType: true,
        images: {
          select: {
            url: true,
          },
          take: 1,
        },
      },
      where: params,
    });

    return homes.map((home) => new HomeResponseDto(home));
  }

  async getHomeById(id: number) {
    const home = await this.prismaService.home.findUnique({
      where: {
        id,
      },
    });

    if (!home) {
      throw new NotFoundException();
    }

    return new HomeResponseDto(home);
  }

  async createHome({
    address,
    numberOfBedrooms,
    numberOfBathrooms,
    city,
    price,
    landSize,
    propertyType,
    images,
  }: CreateHomeParams) {
    const home = await this.prismaService.home.create({
      data: {
        address,
        number_of_bedrooms: numberOfBedrooms,
        number_of_bathrooms: numberOfBathrooms,
        city,
        price,
        land_size: landSize,
        propertyType,
        realtor_id: 4,
      },
    });

    const homeImages = images.map((image) => {
      return { ...image, home_id: home.id };
    });

    await this.prismaService.image.createMany({
      data: homeImages,
    });

    return new HomeResponseDto(home);
  }
}
