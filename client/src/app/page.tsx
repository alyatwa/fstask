import { getOrders, orderKeys } from "@/modules/orders/hooks/api/queries";
import OrdersPage from "@/modules/orders/views/OrdersPage";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

export default async function home() {
  const queryClient = new QueryClient();

  void (await queryClient.prefetchQuery({
    queryKey: orderKeys.getOrders,
    queryFn: getOrders,
  }));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrdersPage />
    </HydrationBoundary>
  );
}
