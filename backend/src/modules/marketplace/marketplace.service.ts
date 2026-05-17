import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MeiliSearch } from 'meilisearch';

@Injectable()
export class MarketplaceService implements OnModuleInit {
  private meiliClient: MeiliSearch;

  constructor(private prisma: PrismaService) {
    this.meiliClient = new MeiliSearch({
      host: process.env.MEILI_HOST || 'http://localhost:7700',
      apiKey: process.env.MEILI_MASTER_KEY || 'masterKey',
    });
  }

  async onModuleInit() {
    // Ensure indexes exist
    await this.meiliClient.index('products').updateSettings({
      searchableAttributes: ['name', 'description', 'shopName'],
    });
    await this.meiliClient.index('shops').updateSettings({
      searchableAttributes: ['name', 'description', 'ownerName'],
    });
  }

  // --- Shop Methods ---

  async createShop(ownerId: string, name: string, description?: string) {
    const shop = await this.prisma.shop.create({
      data: {
        ownerId,
        name,
        description,
      },
      include: { owner: true }
    });

    // Index in Meilisearch
    await this.meiliClient.index('shops').addDocuments([{
      id: shop.id,
      name: shop.name,
      description: shop.description,
      ownerName: shop.owner.name,
    }]);

    return shop;
  }

  async getShops(query: string) {
    if (!query) return this.prisma.shop.findMany({ include: { owner: true } });
    
    const searchResults = await this.meiliClient.index('shops').search(query);
    const shopIds = searchResults.hits.map(h => h.id as string);

    return this.prisma.shop.findMany({
      where: { id: { in: shopIds } },
      include: { owner: true }
    });
  }

  // --- Product Methods ---

  async addProduct(shopId: string, data: { name: string; price: number; stock: number; description?: string; imageUrl?: string }) {
    // 1. Find or create global Product entry
    let product = await this.prisma.product.findFirst({ where: { name: data.name } });
    if (!product) {
      product = await this.prisma.product.create({
        data: { name: data.name, description: data.description, imageUrl: data.imageUrl }
      });
    } else {
      product = await this.prisma.product.update({
        where: { id: product.id },
        data: { imageUrl: data.imageUrl, description: data.description || product.description }
      });
    }

    // 2. Link to Shop
    const shopProduct = await this.prisma.shopProduct.create({
      data: {
        shopId,
        productId: product.id,
        price: data.price,
        stock: data.stock,
      },
      include: { shop: true, product: true }
    });

    // 3. Index in Meilisearch
    await this.meiliClient.index('products').addDocuments([{
      id: shopProduct.id,
      name: product.name,
      description: data.description || product.description,
      price: data.price,
      imageUrl: product.imageUrl,
      shopName: shopProduct.shop.name,
    }]);

    return shopProduct;
  }

  async searchProducts(query: string) {
    if (!query) return this.prisma.shopProduct.findMany({ include: { product: true, shop: true } });

    const searchResults = await this.meiliClient.index('products').search(query);
    const shopProductIds = searchResults.hits.map(h => h.id as string);

    return this.prisma.shopProduct.findMany({
      where: { id: { in: shopProductIds } },
      include: { product: true, shop: true }
    });
  }
}
