
"use client";

import { useCart } from '../CartContext';
import { useEffect, useState } from 'react';




export default function CartPage() {
    const { cart, removeFromCart, clearCart } = useCart();
    // Miktarları local state ile tut
    const [quantities, setQuantities] = useState<{ [id: string]: number }>(
        () => Object.fromEntries(cart.map(item => [item.id, 1]))
    );

    // Sepet değişirse miktarları güncelle
    useEffect(() => {
        setQuantities(q => {
            const next = { ...q };
            cart.forEach(item => {
                if (!(item.id in next)) next[item.id] = 1;
            });
            // Sepetten çıkarılanları sil
            Object.keys(next).forEach(id => {
                if (!cart.find(item => item.id === id)) delete next[id];
            });
            return next;
        });
    }, [cart]);

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                Sepetim ({cart.length} ürün)
            </h1>

            {cart.length === 0 ? (
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
                        {cart.map((item) => {
                            const qty = quantities[item.id] || 1;
                            const unitPrice = 100; // Demo fiyat, gerçek fiyat için ürün objesine ekleyin
                            return (
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
                                                {item.name}
                                            </h3>
                                            <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
                                                SKU: {item.sku}
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                                <span>Birim Fiyat: <b>₺{unitPrice.toFixed(2)}</b></span>
                                                <span style={{ marginLeft: 16 }}>Miktar:
                                                    <button onClick={() => setQuantities(q => ({ ...q, [item.id]: Math.max(1, qty - 1) }))} style={{ marginLeft: 8, marginRight: 4, padding: '0 8px' }}>-</button>
                                                    <b>{qty}</b>
                                                    <button onClick={() => setQuantities(q => ({ ...q, [item.id]: qty + 1 }))} style={{ marginLeft: 4, padding: '0 8px' }}>+</button>
                                                </span>
                                                <span style={{ marginLeft: 16 }}>Toplam: <b>₺{(unitPrice * qty).toFixed(2)}</b></span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
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
                            );
                        })}
                    </div>

                    {/* Cart Summary */}
                    <div style={{
                        padding: '1.5rem',
                        border: '2px solid #3b82f6',
                        borderRadius: '8px',
                        backgroundColor: '#eff6ff'
                    }}>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 12 }}>
                            Toplam Tutar: ₺{cart.reduce((sum, item) => sum + (quantities[item.id] || 1) * 100, 0).toFixed(2)}
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
                                onClick={clearCart}
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
