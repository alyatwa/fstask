"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCancelOrder } from "../hooks/api/mutations";
import { useState } from "react";
import { toast } from "sonner";

interface CancelOrderDialogProps {
  orderId: number;
  disabled: boolean;
  onCancel?: (orderId: string, withRefund: boolean) => void;
}

export const CancelOrderDialog: React.FC<CancelOrderDialogProps> = ({
  orderId,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const { mutateAsync, isPending } = useCancelOrder({
    onError: (error: unknown) => {
      console.error("Error cancelling order:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast.error("Failed to cancel order", { description: errorMessage });
    },
    onSuccess: (data) => {
      console.log("Order cancelled successfully:", data);
      toast.success("Order cancelled successfully");
      setOpen(false);
    },
  });
  const cancelOrder = async (refund: boolean) => {
    await mutateAsync({ id: orderId, data: { refund } });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} variant="destructive">
          Cancel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently cancel the
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="secondary"
            onClick={() => cancelOrder(true)}
            disabled={isPending}
          >
            Cancel with refund
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => cancelOrder(false)}
            disabled={isPending}
          >
            Cancel without a refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
