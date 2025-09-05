import apiRequest from "../../../../lib/request";
import { useQuery } from "@tanstack/react-query";

export const orderKeys = {
  getOrders: ["get-orders"] as const,
};

interface Order {
  id: number;
  status: "CONFIRMED" | "CANCELLED";
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

/*******************  get orders *******************************/
export const getOrders = async (): Promise<Order[]> => {
  const { data } = await apiRequest.get<Order[]>(`/orders?limit=10&page=1`);
  return data || [];
};

export const useGetOrders = () =>
  useQuery({
    queryKey: orderKeys.getOrders,
    queryFn: getOrders,
  });
