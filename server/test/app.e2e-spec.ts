import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MainModule } from '../src/main.module';
import { DataSource } from 'typeorm';
import { OrderEntity } from '../src/database/entities/order.entity';
import { StoreEntity } from '../src/database/entities/store.entity';
import { OrderResponse } from '../src/modules/orders/orders.service';
import { Server } from 'http';

// Define the response type for cancel order endpoint
interface CancelOrderResponse {
  id: number;
  status: string;
  refunded: boolean;
  store_balance_cents?: number;
}

const getServerForTesting = (app: INestApplication) => {
  return app.getHttpServer() as Server;
};

describe('Orders API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MainModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get DataSource for test db operations
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/orders', () => {
    it('should return a list of orders', async () => {
      // Use helper function to get server safely
      const server = getServerForTesting(app);
      const response = await request(server).get('/api/orders').expect(200);

      // Type assertion for the response body
      const orders = response.body as OrderResponse[];

      expect(Array.isArray(orders)).toBe(true);
      if (orders.length > 0) {
        expect(orders[0]).toHaveProperty('id');
        expect(orders[0]).toHaveProperty('status');
        expect(orders[0]).toHaveProperty('amount_cents');
        expect(orders[0]).toHaveProperty('customer');
        expect(orders[0]).toHaveProperty('store');
      }
    });
  });
  describe('PATCH /api/orders/:id', () => {
    let testOrder: OrderEntity;
    let testStore: StoreEntity;

    beforeEach(async () => {
      // Create a test store with balance
      const storeRepo = dataSource.getRepository(StoreEntity);
      testStore = await storeRepo.save({
        name: 'Test Store for E2E',
        balance_cents: 10000,
      });

      // Create a test order for cancellation
      const orderRepo = dataSource.getRepository(OrderEntity);
      testOrder = await orderRepo.save({
        store_id: testStore.id,
        customer_id: 1, // Using existing customer
        status: 'PENDING',
        amount_cents: 5000,
        created_at: new Date(),
        updated_at: new Date(),
      });
    });

    it('should cancel an order without refund', async () => {
      const server = getServerForTesting(app);
      const response = await request(server)
        .patch(`/api/orders/${testOrder.id}`)
        .send({ refund: false })
        .expect(200);

      // Type assertion for the response body
      const responseData = response.body as CancelOrderResponse;

      expect(responseData).toHaveProperty('id', testOrder.id);
      expect(responseData).toHaveProperty('status', 'CANCELLED');
      expect(responseData).toHaveProperty('refunded', false);
      expect(responseData).not.toHaveProperty('store_balance_cents');

      // Verify in database
      const orderRepo = dataSource.getRepository(OrderEntity);
      const updatedOrder = await orderRepo.findOne({
        where: { id: testOrder.id },
      });
      expect(updatedOrder?.status).toBe('CANCELLED');
    });

    it('should cancel an order with refund', async () => {
      const initialBalance = testStore.balance_cents;
      const orderAmount = testOrder.amount_cents;

      const server = getServerForTesting(app);
      const response = await request(server)
        .patch(`/api/orders/${testOrder.id}`)
        .send({ refund: true })
        .expect(200);

      // Type assertion for the response body
      const responseData = response.body as CancelOrderResponse;

      expect(responseData).toHaveProperty('id', testOrder.id);
      expect(responseData).toHaveProperty('status', 'CANCELLED');
      expect(responseData).toHaveProperty('refunded', true);
      expect(responseData).toHaveProperty(
        'store_balance_cents',
        initialBalance - orderAmount,
      );

      // Verify order status in database
      const orderRepo = dataSource.getRepository(OrderEntity);
      const updatedOrder = await orderRepo.findOne({
        where: { id: testOrder.id },
      });
      expect(updatedOrder?.status).toBe('CANCELLED');

      // Verify store balance was reduced
      const storeRepo = dataSource.getRepository(StoreEntity);
      const updatedStore = await storeRepo.findOne({
        where: { id: testStore.id },
      });
      expect(updatedStore?.balance_cents).toBe(initialBalance - orderAmount);
    });

    it('should return 404 for non-existent order', async () => {
      const nonExistentId = 999999;

      const server = getServerForTesting(app);
      await request(server)
        .patch(`/api/orders/${nonExistentId}`)
        .send({ refund: false })
        .expect(404);
    });

    it('should return 400 when trying to cancel already cancelled order', async () => {
      // First, cancel the order
      const server = getServerForTesting(app);
      await request(server)
        .patch(`/api/orders/${testOrder.id}`)
        .send({ refund: false })
        .expect(200);

      // Try to cancel it again
      await request(server)
        .patch(`/api/orders/${testOrder.id}`)
        .send({ refund: false })
        .expect(400);
    });

    it('should return 400 when store has insufficient balance for refund', async () => {
      // Create an order with amount higher than store balance
      const orderRepo = dataSource.getRepository(OrderEntity);
      const largeOrder = await orderRepo.save({
        store_id: testStore.id,
        customer_id: 1,
        status: 'PENDING',
        amount_cents: 20000, // Higher than store balance of 10000
        created_at: new Date(),
        updated_at: new Date(),
      });

      const server = getServerForTesting(app);
      await request(server)
        .patch(`/api/orders/${largeOrder.id}`)
        .send({ refund: true })
        .expect(400);
    });
  });
});
