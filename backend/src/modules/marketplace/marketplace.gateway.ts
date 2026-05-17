import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MarketplaceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private prisma: PrismaService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected to Marketplace: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected from Marketplace: ${client.id}`);
  }

  // Merchant joins a room specific to their shop to receive orders
  @SubscribeMessage('joinShopRoom')
  handleJoinShopRoom(@ConnectedSocket() client: Socket, @MessageBody() shopId: string) {
    client.join(`shop_${shopId}`);
    console.log(`Client ${client.id} joined shop room: shop_${shopId}`);
    return { event: 'joined', data: shopId };
  }

  // Customer joins a room specific to their order or user ID
  @SubscribeMessage('joinCustomerRoom')
  handleJoinCustomerRoom(@ConnectedSocket() client: Socket, @MessageBody() customerId: string) {
    client.join(`customer_${customerId}`);
    console.log(`Client ${client.id} joined customer room: customer_${customerId}`);
    return { event: 'joined', data: customerId };
  }

  // Place an order (from Customer)
  @SubscribeMessage('placeOrder')
  async handlePlaceOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { shopId: string; customerId: string; items: any[]; totalAmount: number }
  ) {
    let userId = data.customerId;
    const userExists = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      const firstUser = await this.prisma.user.findFirst();
      if (firstUser) {
        userId = firstUser.id;
      } else {
        const mockUser = await this.prisma.user.create({
          data: { name: 'Mock Customer', firebaseUid: 'mock-customer-' + Date.now(), role: 'passenger' }
        });
        userId = mockUser.id;
      }
    }

    // Save order in DB
    const order = await this.prisma.order.create({
      data: {
        userId: userId,
        totalAmount: data.totalAmount,
        status: 'PENDING',
        items: {
          create: data.items.map(i => ({
            shopProductId: i.shopProductId,
            quantity: i.quantity,
            priceAtTime: i.price
          }))
        }
      },
      include: { items: { include: { shopProduct: { include: { product: true } } } }, user: true }
    });

    // Notify Merchant
    this.server.to(`shop_${data.shopId}`).emit('newOrder', order);
    
    return { event: 'orderPlaced', data: order };
  }

  // Update order status (from Merchant)
  @SubscribeMessage('updateOrderStatus')
  async handleUpdateOrderStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; status: 'CONFIRMED' | 'REJECTED' }
  ) {
    // Update DB
    const order = await this.prisma.order.update({
      where: { id: data.orderId },
      data: { status: data.status },
      include: { user: true }
    });

    // Notify Customer
    this.server.to(`customer_${order.userId}`).emit('orderStatusUpdated', order);
    
    return { event: 'orderUpdated', data: order };
  }
}
