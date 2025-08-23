'use client'

import { useState, useEffect } from 'react';

interface Product {
    id: string;
    sku: string;
    name: string;
    description: string;
    is_active: number;
}

interface Category {
    id: string;
    parent_id?: string;
    slug: string;
    name: string;
}

export default function CatalogPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadCatalogData();
    }, []);

    const loadCatalogData = async () => {
        try {
            setLoading(true);

            // Products fetch
            const productsResponse = await fetch('http://localhost:3001/api/products');
            if (productsResponse.ok) {
                const productsData = await productsResponse.json();
                setProducts(productsData.items || []);
            }

            // Categories fetch
            const categoriesResponse = await fetch('http://localhost:3001/api/categories');
            if (categoriesResponse.ok) {
                const categoriesData = await categoriesResponse.json();
                setCategories(categoriesData.items || []);
            }

            setError(null);
        } catch (err) {
            console.error('Catalog data loading error:', err);
            setError('Katalog verileri yüklenirken hata oluştu. API sunucusu çalışıyor mu?');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Katalog Yükleniyor...</div>
                <div style={{ color: '#6b7280' }}>Ürünler ve kategoriler getiriliyor...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '1rem',
                    color: '#dc2626'
                }}>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>Hata</h3>
                    <p style={{ margin: 0 }}>{error}</p>
                    <button
                        onClick={loadCatalogData}
                        style={{
                            marginTop: '1rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Tekrar Dene
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                Katalog
            </h1>

            {/* Categories Section */}
            <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                    Kategoriler ({categories.length})
                </h2>
                {categories.length === 0 ? (
                    <div style={{
                        padding: '2rem',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        textAlign: 'center',
                        color: '#6b7280'
                    }}>
                        Henüz kategori bulunmuyor.
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '1rem'
                    }}>
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                style={{
                                    padding: '1rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    backgroundColor: '#f8fafc',
                                    cursor: 'pointer'
                                }}
                            >
                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                                    {category.name}
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                                    {category.slug}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Products Section */}
            <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                    Ürünler ({products.length})
                </h2>
                {products.length === 0 ? (
                    <div style={{
                        padding: '2rem',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        textAlign: 'center',
                        color: '#6b7280'
                    }}>
                        Henüz ürün bulunmuyor.
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {products.map((product) => (
                            <div
                                key={product.id}
                                style={{
                                    padding: '1.5rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    backgroundColor: 'white',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        backgroundColor: '#e5e7eb',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        color: '#374151'
                                    }}>
                                        {product.sku}
                                    </span>
                                </div>
                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
                                    {product.name}
                                </h3>
                                {product.description && (
                                    <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
                                        {product.description}
                                    </p>
                                )}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        backgroundColor: product.is_active ? '#dcfce7' : '#fef2f2',
                                        color: product.is_active ? '#166534' : '#dc2626'
                                    }}>
                                        {product.is_active ? 'Aktif' : 'Pasif'}
                                    </span>
                                    <button style={{
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '4px',
                                        fontSize: '0.875rem',
                                        cursor: 'pointer'
                                    }}>
                                        Detay
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
