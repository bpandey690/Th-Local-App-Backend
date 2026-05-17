import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private marketplaceService: MarketplaceService,
    private prisma: PrismaService
  ) {}

  @Post('shops')
  async createShop(@Body() body: { ownerId: string; name: string; description?: string }) {
    return this.marketplaceService.createShop(body.ownerId, body.name, body.description);
  }

  @Get('shops/search')
  async searchShops(@Query('q') query: string) {
    return this.marketplaceService.getShops(query);
  }

  @Post('products')
  async addProduct(@Body() body: { shopId: string; name: string; price: number; stock: number; description?: string; imageUrl?: string }) {
    return this.marketplaceService.addProduct(body.shopId, body);
  }

  @Get('products/search')
  async searchProducts(@Query('q') query: string) {
    return this.marketplaceService.searchProducts(query);
  }

  @Get('debug/init')
  async initDebugShop() {
    let user = await this.prisma.user.findFirst();
    if (!user) {
      user = await this.prisma.user.create({
        data: { name: 'Mock Merchant', firebaseUid: 'mock-' + Date.now(), role: 'merchant' }
      });
    }
    let shop = await this.prisma.shop.findFirst({ where: { ownerId: user.id } });
    if (!shop) {
      shop = await this.marketplaceService.createShop(user.id, 'My Awesome Shop', 'A mock shop');
    }
    return { shopId: shop.id, ownerId: user.id };
  }
}
