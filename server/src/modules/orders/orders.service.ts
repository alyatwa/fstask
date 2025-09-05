import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { OrderEntity } from '../../database/entities/order.entity';
import { StoreEntity } from '../../database/entities/store.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CancelOrderResponse, OrderResponse } from './orders.types';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private ordersRepository: Repository<OrderEntity>,
    private dataSource: DataSource,
  ) {}

  async listOrders(): Promise<OrderResponse[]> {
    // Get orders with related customer and store data
    const orders = await this.ordersRepository.find({
      relations: ['customer', 'store'],
    });

    // Transform the data to match the required format
    return orders.map((order) => ({
      id: order.id,
      status: order.status,
      amount_cents: order.amount_cents,
      created_at: new Date(order.created_at).toDateString(),
      updated_at: order.updated_at.toDateString(),
      customer: {
        id: order.customer.id,
        name: order.customer.name,
      },
      store: {
        id: order.store.id,
        name: order.store.name,
      },
    }));
  }

  async cancelOrder(id: string, refund: boolean): Promise<CancelOrderResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const orderRepository = queryRunner.manager.getRepository(OrderEntity);
      const storeRepository = queryRunner.manager.getRepository(StoreEntity);

      // Find the order with store relation
      const order = await orderRepository.findOne({
        where: { id: parseInt(id) },
        relations: ['store'],
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      // Check if order is already cancelled
      if (order.status === 'CANCELLED') {
        throw new BadRequestException(
          `Order with ID ${id} is already cancelled`,
        );
      }

      // Handle refund if needed
      let refunded = false;
      let storeBalanceCents: number | undefined;

      if (refund) {
        // Get store with fresh balance data
        const store = await storeRepository.findOne({
          where: { id: order.store_id },
        });

        if (!store) {
          throw new NotFoundException(
            `Store with ID ${order.store_id} not found`,
          );
        }

        // Check if store has sufficient balance for refund
        if (store.balance_cents < order.amount_cents) {
          throw new BadRequestException('Insufficient balance');
        }

        // Deduct amount from store balance
        store.balance_cents -= order.amount_cents;
        await storeRepository.save(store);

        refunded = true;
        storeBalanceCents = store.balance_cents;
      }

      // Update order status
      order.status = 'CANCELLED';
      order.updated_at = new Date();
      await orderRepository.save(order);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Return response according to specifications
      const response: CancelOrderResponse = {
        id: order.id,
        status: order.status,
        refunded,
      };

      // Only include store_balance_cents if refund was processed
      if (refunded && storeBalanceCents !== undefined) {
        response.store_balance_cents = storeBalanceCents;
      }

      return response;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
