export interface CancelOrderResponse {
  id: number;
  status: string;
  refunded: boolean;
  store_balance_cents?: number;
}

export interface OrderResponse {
  id: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  amount_cents: number;
  created_at: string;
  updated_at: string;
  customer: {
    id: number;
    name: string;
  };
  store: {
    id: number;
    name: string;
  };
}
