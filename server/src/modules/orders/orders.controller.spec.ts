import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
  let ordersController: OrdersController;
  let ordersService: OrdersService;

  const mockOrdersService = {
    listOrders: jest.fn().mockImplementation(() => Promise.resolve([])),
    cancelOrder: jest.fn().mockImplementation(() => Promise.resolve({})),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    ordersController = app.get<OrdersController>(OrdersController);
    ordersService = app.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listOrders', () => {
    it('should return orders', async () => {
      // Arrange
      const mockOrders = [
        {
          id: 1,
          status: 'PENDING',
          amount_cents: 1000,
          created_at: new Date().toDateString(),
          updated_at: new Date().toDateString(),
          customer: { id: 1, name: 'Customer 1' },
          store: { id: 1, name: 'Store 1' },
        },
        {
          id: 2,
          status: 'CONFIRMED',
          amount_cents: 2000,
          created_at: new Date().toDateString(),
          updated_at: new Date().toDateString(),
          customer: { id: 2, name: 'Customer 2' },
          store: { id: 2, name: 'Store 2' },
        },
      ];
      mockOrdersService.listOrders.mockImplementation(() =>
        Promise.resolve(mockOrders),
      );

      // Act
      const result = await ordersController.listOrders();

      // Assert
      expect(result).toBe(mockOrders);
      expect(ordersService.listOrders).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order without refund successfully', async () => {
      // Arrange
      const orderId = '1';
      const refund = false;
      const mockResponse = {
        id: 1,
        status: 'CANCELLED',
        refunded: false,
      };
      mockOrdersService.cancelOrder.mockImplementation(() =>
        Promise.resolve(mockResponse),
      );

      // Act
      const result = await ordersController.cancelOrder(orderId, { refund });

      // Assert
      expect(result).toBe(mockResponse);
      expect(ordersService.cancelOrder).toHaveBeenCalledWith(orderId, refund);
    });

    it('should cancel order with refund successfully', async () => {
      // Arrange
      const orderId = '1';
      const refund = true;
      const mockResponse = {
        id: 1,
        status: 'CANCELLED',
        refunded: true,
        store_balance_cents: 5000,
      };
      mockOrdersService.cancelOrder.mockImplementation(() =>
        Promise.resolve(mockResponse),
      );

      // Act
      const result = await ordersController.cancelOrder(orderId, { refund });

      // Assert
      expect(result).toBe(mockResponse);
      expect(ordersService.cancelOrder).toHaveBeenCalledWith(orderId, refund);
      expect(result.store_balance_cents).toBe(5000);
    });
  });
});
