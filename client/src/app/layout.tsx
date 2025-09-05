import type { Metadata } from "next";
import "./globals.css";
import ReactQueryProvider from "@/reactQuery";

export const metadata: Metadata = {
  title: "Order Management System",
  description: "Manage orders, customers, and stores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-svh">
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
