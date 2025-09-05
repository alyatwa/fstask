import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CustomerEntity } from './customer.entity';
import { StoreEntity } from './store.entity';

@Entity({ name: 'orders' })
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  store_id: number;

  @Column({ type: 'int' })
  customer_id: number;

  @Column({ type: 'text', default: 'PENDING' })
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';

  @Column({ type: 'int' })
  amount_cents: number;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @ManyToOne(() => StoreEntity, (store) => store.orders)
  @JoinColumn({ name: 'store_id' })
  store: StoreEntity;

  @ManyToOne(() => CustomerEntity, (customer) => customer.orders)
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerEntity;
}
