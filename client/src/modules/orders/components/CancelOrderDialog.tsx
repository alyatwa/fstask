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

interface CancelOrderDialogProps {
  orderId: number;
  onCancel?: (orderId: string, withRefund: boolean) => void;
}

export const CancelOrderDialog: React.FC<CancelOrderDialogProps> = ({
  orderId,
}) => {
  const [open, setOpen] = useState(false);
  const { mutateAsync, isPending } = useCancelOrder({
    onError: (error) => {
      console.error("Error cancelling order:", error);
    },
    onSuccess: (data) => {
      console.log("Order cancelled successfully:", data);
      setOpen(false);
    },
  });
  const cancelOrder = async (refund: boolean) => {
    await mutateAsync({ id: orderId, data: { refund } });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Cancel</Button>
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
