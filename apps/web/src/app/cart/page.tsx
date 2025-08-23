'use client'

import { useState, useEffect } from 'react';

interface CartItem {
    id: string;
    product_name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

export default function CartPage() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Mock cart data for now (since we don't have cart API yet)
    useEffect(() => {
        // Simulating cart data
        const mockCartItems: CartItem[] = [
            {
                id: '1',
                product_name: 'Örnek Ürün 1',
                sku: 'PRD001',
                quantity: 2,
                unit_price: 299.99,
                total_price: 599.98
            },
            {
                id: '2',
                product_name: 'Örnek Ürün 2',
                sku: 'PRD002',
                quantity: 1,
                unit_price: 199.99,
                total_price: 199.99
            }
        ];
        setCartItems(mockCartItems);
    }, []);

    const updateQuantity = (itemId: string, newQuantity: number) => {
        if (newQuantity === 0) {
            setCartItems(items => items.filter(item => item.id !== itemId));
        } else {
            setCartItems(items =>
                items.map(item =>
                    item.id === itemId
                        ? { ...item, quantity: newQuantity, total_price: item.unit_price * newQuantity }
                        : item
                )
            );
        }
    };

    const getTotalAmount = () => {
        return cartItems.reduce((total, item) => total + item.total_price, 0);
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div>Sepet yükleniyor...</div>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                Sepetim ({cartItems.length} ürün)
            </h1>

            {cartItems.length === 0 ? (
                <div style={{
                    padding: '3rem',
                    textAlign: 'center',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                }}>
                    <h3 style={{ marginBottom: '1rem', color: '#6b7280' }}>
                        Sepetiniz boş
                    </h3>
                    <p style={{ marginBottom: '2rem', color: '#9ca3af' }}>
                        Alışverişe başlamak için katalogdan ürün ekleyiniz.
                    </p>
                    <a
                        href="/catalog"
                        style={{
                            display: 'inline-block',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '4px',
                            textDecoration: 'none',
                            fontSize: '1rem'
                        }}
                    >
                        Kataloğa Git
                    </a>
                </div>
            ) : (
                <div>
                    {/* Cart Items */}
                    <div style={{ marginBottom: '2rem' }}>
                        {cartItems.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    padding: '1.5rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    marginBottom: '1rem',
                                    backgroundColor: 'white'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
                                            {item.product_name}
                                        </h3>
                                        <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
                                            SKU: {item.sku}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>
                                            ₺{item.unit_price.toFixed(2)} / adet
                                        </p>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        {/* Quantity Controls */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                style={{
                                                    backgroundColor: '#f3f4f6',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '4px',
                                                    padding: '0.25rem 0.5rem',
                                                    cursor: 'pointer',
                                                    fontSize: '1rem'
                                                }}
                                            >
                                                -
                                            </button>
                                            <span style={{ minWidth: '2rem', textAlign: 'center', fontSize: '1rem' }}>
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                style={{
                                                    backgroundColor: '#f3f4f6',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '4px',
                                                    padding: '0.25rem 0.5rem',
                                                    cursor: 'pointer',
                                                    fontSize: '1rem'
                                                }}
                                            >
                                                +
                                            </button>
                                        </div>

                                        {/* Total Price */}
                                        <div style={{ minWidth: '100px', textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                                                ₺{item.total_price.toFixed(2)}
                                            </div>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => updateQuantity(item.id, 0)}
                                            style={{
                                                backgroundColor: '#ef4444',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '0.5rem',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            Kaldır
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Cart Summary */}
                    <div style={{
                        padding: '1.5rem',
                        border: '2px solid #3b82f6',
                        borderRadius: '8px',
                        backgroundColor: '#eff6ff'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: '600' }}>Toplam:</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                ₺{getTotalAmount().toFixed(2)}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button style={{
                                flex: 1,
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}>
                                Siparişi Tamamla
                            </button>

                            <button
                                onClick={() => setCartItems([])}
                                style={{
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Sepeti Temizle
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
