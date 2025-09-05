import { Controller, Get, Param, Body, HttpCode, Patch } from '@nestjs/common';
import { OrderResponse, OrdersService } from './orders.service';

interface CancelOrderResponse {
  id: number;
  status: string;
  refunded: boolean;
  store_balance_cents?: number;
}

@Controller('/api/')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('orders')
  listOrders(): Promise<OrderResponse[]> {
    return this.ordersService.listOrders();
  }

  @Patch('orders/:id')
  @HttpCode(200) // Ensure we return 200 OK on success
  cancelOrder(
    @Param('id') id: string,
    @Body() body: { refund: boolean },
  ): Promise<CancelOrderResponse> {
    console.log('Canceling order with ID:', body);
    return this.ordersService.cancelOrder(id, body.refund);
  }
}
