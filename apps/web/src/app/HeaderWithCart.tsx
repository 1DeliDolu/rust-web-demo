"use client";
import React, { useEffect, useState } from 'react';
import { useCart } from './CartContext';

export default function HeaderWithCart() {
    const { cart } = useCart();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);


    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('access_token');
            setIsLoggedIn(!!token);
            if (token) {
                // JWT decode (payload base64)
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    setIsAdmin(payload.role === 'admin');
                } catch { }
            } else {
                setIsAdmin(false);
            }
        }
    }, []);

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            setIsLoggedIn(false);
            window.location.href = '/';
        }
    };

    return (
        <header className="bg-blue-600 text-white p-4">
            <nav className="container mx-auto flex justify-between items-center">
                <h1 className="text-xl font-bold">E-Ticaret</h1>
                <div className="flex items-center">
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
                    {!isLoggedIn ? (
                        <>
                            <a href="/login" className="mr-4 hover:underline">Giriş Yap</a>
                            <a href="/register" className="mr-4 hover:underline">Kayıt Ol</a>
                        </>
                    ) : (
                        <>
                            {isAdmin && (
                                <a href="/users" className="mr-4 hover:underline">Kullanıcılar</a>
                            )}
                            <button onClick={handleLogout} className="ml-2 bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded">Çıkış Yap</button>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
}
