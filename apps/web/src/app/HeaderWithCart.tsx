"use client";
import React from 'react';
import { useCart } from './CartContext';

export default function HeaderWithCart() {
    const { cart } = useCart();
    return (
        <header className="bg-blue-600 text-white p-4">
            <nav className="container mx-auto flex justify-between">
                <h1 className="text-xl font-bold">E-Ticaret</h1>
                <div>
                    <a href="/" className="mr-4 hover:underline">Ana Sayfa</a>
                    <a href="/catalog" className="mr-4 hover:underline">Katalog</a>
                    <a href="/cart" className="mr-4 hover:underline relative">
                        Sepet
                        {cart.length > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: -8,
                                right: -12,
                                background: 'red',
                                color: 'white',
                                borderRadius: '50%',
                                width: 20,
                                height: 20,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 700,
                                border: '2px solid white',
                                zIndex: 10
                            }}>{cart.length}</span>
                        )}
                    </a>
                </div>
            </nav>
        </header>
    );
}
