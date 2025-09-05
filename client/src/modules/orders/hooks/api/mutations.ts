import { queryClient } from "@/reactQuery";
import apiRequest from "../../../../lib/request";
import { useMutation } from "@tanstack/react-query";

export const orderKeys = {
  cancelOrder: ["cancelOrder"] as const,
};

interface CancelOrderInput {
  id: number;
  data: {
    refund: boolean;
  };
}

/*******************  cancel order *******************************/
export const cancelOrder = async (details: CancelOrderInput): Promise<any> => {
  const { data } = await apiRequest.patch<CancelOrderInput["data"]>(
    `/orders/${details.id}`,
    { ...details.data }
  );
  return data;
};

export const useCancelOrder = ({
  onSuccess,
  onError,
}: {
  onSuccess?: (
    data: any,
    variables: CancelOrderInput,
    context: unknown
  ) => void;
  onError?: (
    error: unknown,
    variables: CancelOrderInput,
    context: unknown
  ) => void;
}) =>
  useMutation({
    mutationFn: (details: CancelOrderInput) => cancelOrder(details),
    mutationKey: orderKeys.cancelOrder,
    onError: (error, variables, context) => {
      if (onError) onError(error, variables, context);
    },
    onSuccess: (data, variables, context) => {
      if (onSuccess) onSuccess(data, variables, context);
      queryClient.invalidateQueries({ queryKey: ["get-orders"] });
    },
  });
