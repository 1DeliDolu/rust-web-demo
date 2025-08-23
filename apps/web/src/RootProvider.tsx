"use client";
import { CartProvider } from "./app/CartContext";
export default function RootProvider({ children }: { children: React.ReactNode }) {
    return <CartProvider>{children}</CartProvider>;
}