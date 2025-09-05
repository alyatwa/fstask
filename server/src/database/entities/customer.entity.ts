import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { OrderEntity } from './order.entity';

@Entity({ name: 'customers' })
export class CustomerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @OneToMany(() => OrderEntity, (order) => order.customer)
  orders: OrderEntity[];
}
