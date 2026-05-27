import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { SmsService } from './sms.service';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [FirebaseAuthGuard, SmsService],
  exports: [FirebaseAuthGuard, SmsService],
})
export class AuthModule {}
