"use client";

import { useState } from "react";
import { CancelOrderDialog } from "../components/CancelOrderDialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetOrders } from "../hooks/api/queries";

export default function OrdersPage() {
  const { data: orders, isFetching } = useGetOrders();

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-gray-50">
      {/* Header */}
      <header className="shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-1/2 mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white ">
        {/* Orders Table */}
        <div className="shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Order List</h2>
          </div>

          <div className="overflow-x-auto w-full">
            <Table>
              <TableCaption>A list of your recent orders.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders &&
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.customer.name}</TableCell>
                      <TableCell>{order.store.name}</TableCell>
                      <TableCell>${order.amount_cents.toFixed(2)}</TableCell>
                      <TableCell>{order.status}</TableCell>
                      <TableCell>{order.created_at}</TableCell>
                      <TableCell>
                        <CancelOrderDialog
                          orderId={order.id}
                          disabled={order.status === "CANCELLED"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
