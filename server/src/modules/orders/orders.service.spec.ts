import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderEntity } from '../../database/entities/order.entity';
import { StoreEntity } from '../../database/entities/store.entity';
import { DataSource, EntityManager, QueryRunner, Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let ordersRepository: Repository<OrderEntity>;
  let mockQueryRunner: QueryRunner;
  let mockDataSource: Partial<DataSource>;
  let mockOrderRepository: Partial<Repository<OrderEntity>>;
  let mockStoreRepository: Partial<Repository<StoreEntity>>;

  // Mock data
  const mockOrders: OrderEntity[] = [
    {
      id: 1,
      store_id: 1,
      customer_id: 1,
      status: 'PENDING',
      amount_cents: 1000,
      created_at: new Date(),
      updated_at: new Date(),
      store: {
        id: 1,
        name: 'Store 1',
        balance_cents: 10000,
        orders: [],
      },
      customer: {
        id: 1,
        name: 'Customer 1',
        orders: [],
      },
    },
    {
      id: 2,
      store_id: 2,
      customer_id: 2,
      status: 'CONFIRMED',
      amount_cents: 2000,
      created_at: new Date(),
      updated_at: new Date(),
      store: {
        id: 2,
        name: 'Store 2',
        balance_cents: 5000,
        orders: [],
      },
      customer: {
        id: 2,
        name: 'Customer 2',
        orders: [],
      },
    },
  ];

  const mockStore: StoreEntity = {
    id: 1,
    name: 'Store 1',
    balance_cents: 10000,
    orders: [],
  };

  beforeEach(async () => {
    mockOrderRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as Partial<Repository<OrderEntity>>;

    mockStoreRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as Partial<Repository<StoreEntity>>;

    // Create a proper mock for EntityManager
    const mockEntityManager = {
      // Required method by tests
      getRepository: jest.fn((entity) => {
        if (entity === OrderEntity) return mockOrderRepository;
        if (entity === StoreEntity) return mockStoreRepository;
      }),
    };

    mockQueryRunner = {
      // Using arrow functions to avoid unbound method issues
      connect: jest.fn(() => Promise.resolve(undefined)),
      startTransaction: jest.fn(() => Promise.resolve(undefined)),
      commitTransaction: jest.fn(() => Promise.resolve(undefined)),
      rollbackTransaction: jest.fn(() => Promise.resolve(undefined)),
      release: jest.fn(() => Promise.resolve(undefined)),
      manager: mockEntityManager as unknown as EntityManager,
      connection: mockDataSource as unknown as DataSource,
      isReleased: false,
      isTransactionActive: false,
    } as unknown as QueryRunner;

    mockDataSource = {
      createQueryRunner: jest.fn(() => mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(OrderEntity),
          useClass: Repository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    ordersRepository = module.get<Repository<OrderEntity>>(
      getRepositoryToken(OrderEntity),
    );

    // Mock the repository methods
    jest
      .spyOn(ordersRepository, 'find')
      .mockReturnValue(Promise.resolve(mockOrders));
  });

  describe('listOrders', () => {
    it('should return all orders with customer and store info', async () => {
      // Act
      const result = await service.listOrders();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].status).toBe('PENDING');
      expect(result[0].customer.name).toBe('Customer 1');
      expect(result[0].store.name).toBe('Store 1');
      expect(ordersRepository.find).toHaveBeenCalledWith({
        relations: ['customer', 'store'],
      });
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order without refund', async () => {
      // Arrange
      const orderId = '1';
      const mockOrder = { ...mockOrders[0] };
      mockOrderRepository.findOne = jest.fn(() => Promise.resolve(mockOrder));
      mockOrderRepository.save = jest.fn().mockReturnValue(
        Promise.resolve({
          ...mockOrder,
          status: 'CANCELLED',
        }),
      );

      // Act
      const result = await service.cancelOrder(orderId, false);

      // Assert
      expect(result.id).toBe(1);
      expect(result.status).toBe('CANCELLED');
      expect(result.refunded).toBe(false);
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockOrderRepository.save).toHaveBeenCalled();
      expect(mockStoreRepository.save).not.toHaveBeenCalled();
    });

    it('should cancel order with refund', async () => {
      const orderId = '1';
      const mockOrder = { ...mockOrders[0] };
      const mockStoreEntity = { ...mockStore };

      mockOrderRepository.findOne = jest.fn(() => Promise.resolve(mockOrder));
      mockStoreRepository.findOne = jest.fn(() =>
        Promise.resolve(mockStoreEntity),
      );

      mockOrderRepository.save = jest.fn().mockReturnValue(
        Promise.resolve({
          ...mockOrder,
          status: 'CANCELLED',
        }),
      );

      mockStoreRepository.save = jest.fn().mockReturnValue(
        Promise.resolve({
          ...mockStoreEntity,
          balance_cents: 9000, // 10000 - 1000
        }),
      );

      // Act
      const result = await service.cancelOrder(orderId, true);

      // Assert
      expect(result.id).toBe(1);
      expect(result.status).toBe('CANCELLED');
      expect(result.refunded).toBe(true);
      expect(result.store_balance_cents).toBe(9000);
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockOrderRepository.save).toHaveBeenCalled();
      expect(mockStoreRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if order not found', async () => {
      // Arrange
      const orderId = '999';
      mockOrderRepository.findOne = jest
        .fn()
        .mockReturnValue(Promise.resolve(null));

      // Act & Assert
      await expect(service.cancelOrder(orderId, false)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if order is already cancelled', async () => {
      // Arrange
      const orderId = '1';
      const mockOrder = { ...mockOrders[0], status: 'CANCELLED' as const };
      mockOrderRepository.findOne = jest
        .fn()
        .mockReturnValue(Promise.resolve(mockOrder));

      // Act & Assert
      await expect(service.cancelOrder(orderId, false)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if store not found during refund', async () => {
      // Arrange
      const orderId = '1';
      const mockOrder = { ...mockOrders[0] };
      mockOrderRepository.findOne = jest
        .fn()
        .mockReturnValue(Promise.resolve(mockOrder));
      mockStoreRepository.findOne = jest
        .fn()
        .mockReturnValue(Promise.resolve(null));

      // Act & Assert
      await expect(service.cancelOrder(orderId, true)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if store has insufficient balance for refund', async () => {
      // Arrange
      const orderId = '1';
      const mockOrder = { ...mockOrders[0] };
      mockOrder.amount_cents = 20000; // More than store balance

      const mockStoreEntity = { ...mockStore };
      mockStoreEntity.balance_cents = 10000;

      mockOrderRepository.findOne = jest
        .fn()
        .mockReturnValue(Promise.resolve(mockOrder));
      mockStoreRepository.findOne = jest
        .fn()
        .mockReturnValue(Promise.resolve(mockStoreEntity));

      // Act & Assert
      await expect(service.cancelOrder(orderId, true)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });
});
