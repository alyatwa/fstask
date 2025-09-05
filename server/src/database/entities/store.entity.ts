import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { OrderEntity } from './order.entity';

@Entity({ name: 'stores' })
export class StoreEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int', default: 0 })
  balance_cents: number;

  @OneToMany(() => OrderEntity, (order) => order.store)
  orders: OrderEntity[];
}
