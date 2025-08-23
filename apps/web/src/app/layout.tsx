import React from 'react'
import './globals.css'

export const metadata = {
    title: 'E-Ticaret Platformu',
    description: 'Rust + Next.js ile E-Ticaret',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="tr">
            <body>
                <header className="bg-blue-600 text-white p-4">
                    <nav className="container mx-auto flex justify-between">
                        <h1 className="text-xl font-bold">E-Ticaret</h1>
                        <div>
                            <a href="/" className="mr-4 hover:underline">Ana Sayfa</a>
                            <a href="/catalog" className="mr-4 hover:underline">Katalog</a>
                            <a href="/cart" className="mr-4 hover:underline">Sepet</a>
                        </div>
                    </nav>
                </header>
                <main className="container mx-auto p-4">
                    {children}
                </main>
            </body>
        </html>
    )
}
