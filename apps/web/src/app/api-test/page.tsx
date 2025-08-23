'use client'

import { useState } from 'react';

export default function ApiTest() {
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    const testHealth = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/health');
            const data = await response.text();
            setResult(`Health Check: ${data}`);
        } catch (error) {
            setResult(`Error: ${error}`);
        }
        setLoading(false);
    };

    const testProducts = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/products');
            const data = await response.json();
            setResult(`Products: ${JSON.stringify(data, null, 2)}`);
        } catch (error) {
            setResult(`Error: ${error}`);
        }
        setLoading(false);
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                API Test Sayfası
            </h1>

            <div style={{ marginBottom: '2rem' }}>
                <button
                    onClick={testHealth}
                    disabled={loading}
                    style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '4px',
                        border: 'none',
                        marginRight: '1rem',
                        cursor: 'pointer'
                    }}
                >
                    {loading ? 'Test Ediliyor...' : 'Health Check'}
                </button>

                <button
                    onClick={testProducts}
                    disabled={loading}
                    style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    {loading ? 'Test Ediliyor...' : 'Products Test'}
                </button>
            </div>

            {result && (
                <div style={{
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    padding: '1rem',
                    marginTop: '1rem'
                }}>
                    <h3 style={{ marginBottom: '0.5rem', fontWeight: '600' }}>Sonuç:</h3>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                        {result}
                    </pre>
                </div>
            )}
        </div>
    );
}
