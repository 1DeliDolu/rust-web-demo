export default function Home() {
    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                E-Ticaret Platformu
            </h1>
            <p style={{ marginBottom: '2rem' }}>
                Rust (Axum) + Next.js ile geliştirilmiş modern e-ticaret platformu.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                        Katalog
                    </h3>
                    <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                        Ürünleri inceleyin ve kategorilere göz atın
                    </p>
                    <a
                        href="/catalog"
                        style={{
                            display: 'inline-block',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            textDecoration: 'none'
                        }}
                    >
                        Kataloga Git
                    </a>
                </div>

                <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                        Sepetim
                    </h3>
                    <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                        Sepetinizdeki ürünleri görüntüleyin
                    </p>
                    <a
                        href="/cart"
                        style={{
                            display: 'inline-block',
                            backgroundColor: '#10b981',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            textDecoration: 'none'
                        }}
                    >
                        Sepete Git
                    </a>
                </div>

                <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                        API Durumu
                    </h3>
                    <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                        Backend API'yi test edin
                    </p>
                    <a
                        href="/api-test"
                        style={{
                            display: 'inline-block',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            textDecoration: 'none'
                        }}
                    >
                        API Test
                    </a>
                </div>
            </div>
        </div>
    )
}
