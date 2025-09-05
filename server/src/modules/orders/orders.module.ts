import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from '../../database/entities/order.entity';
import { CustomerEntity } from '../../database/entities/customer.entity';
import { StoreEntity } from '../../database/entities/store.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, CustomerEntity, StoreEntity]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
