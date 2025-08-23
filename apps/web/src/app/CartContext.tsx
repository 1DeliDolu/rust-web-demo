"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartProduct {
    id: string;
    sku: string;
    name: string;
    description?: string;
    is_active?: number;
    quantity: number;
}

interface CartContextType {
    cart: CartProduct[];
    addToCart: (product: CartProduct) => void;
    removeFromCart: (id: string) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within CartProvider");
    return ctx;
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [cart, setCart] = useState<CartProduct[]>([]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("cart");
            if (stored) setCart(JSON.parse(stored));
        }
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("cart", JSON.stringify(cart));
        }
    }, [cart]);

    const addToCart = (product: CartProduct) => {
        setCart((prev) => {
            const existing = prev.find((p) => p.id === product.id);
            if (existing) {
                return prev.map((p) =>
                    p.id === product.id ? { ...p, quantity: p.quantity + (product.quantity || 1) } : p
                );
            } else {
                return [...prev, { ...product, quantity: product.quantity || 1 }];
            }
        });
    };
    const removeFromCart = (id: string) => {
        setCart((prev) => prev.filter((p) => p.id !== id));
    };
    const clearCart = () => setCart([]);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};