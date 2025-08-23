"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "../../CartContext";

interface Product {
    id: string;
    sku: string;
    name: string;
    description: string;
    is_active: number;
    quantity?: number;
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [added, setAdded] = useState(false);
    const { addToCart } = useCart();

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:3001/api/products/${params.id}`);
                if (!res.ok) throw new Error("Ürün bulunamadı");
                const data = await res.json();
                setProduct(data.item);
                setError(null);
            } catch (err: any) {
                setError(err.message || "Hata oluştu");
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [params.id]);

    const handleAddToCart = () => {
        if (product) {
            addToCart({ ...product, quantity: 1 });
            setAdded(true);
            setTimeout(() => {
                router.push("/cart");
            }, 1000);
        }
    };

    if (loading) return <div style={{ padding: 32 }}>Yükleniyor...</div>;
    if (error) return <div style={{ padding: 32, color: "red" }}>{error}</div>;
    if (!product) return null;

    return (
        <div style={{ maxWidth: 600, margin: "2rem auto", padding: 24, border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 16 }}>{product.name}</h1>
            <div style={{ marginBottom: 8 }}><b>SKU:</b> {product.sku}</div>
            <div style={{ marginBottom: 8 }}><b>Açıklama:</b> {product.description || "-"}</div>
            <div style={{ marginBottom: 8 }}><b>Durum:</b> {product.is_active ? "Aktif" : "Pasif"}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button
                    onClick={() => router.push("/catalog")}
                    style={{ background: "#e5e7eb", color: "#374151", border: "none", padding: "0.5rem 1.5rem", borderRadius: 4, cursor: "pointer" }}
                >
                    Ürünlere Dön
                </button>
                <button
                    onClick={handleAddToCart}
                    style={{ background: "#3b82f6", color: "white", border: "none", padding: "0.5rem 1.5rem", borderRadius: 4, cursor: "pointer" }}
                    disabled={added}
                >
                    {added ? "Sepete Eklendi!" : "Sepete Ekle"}
                </button>
            </div>
        </div>
    );
}
