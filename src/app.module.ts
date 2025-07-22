import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GlobalsModule } from './globals/globals.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ServiceModule } from './service/service.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    GlobalsModule,
    ServiceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
