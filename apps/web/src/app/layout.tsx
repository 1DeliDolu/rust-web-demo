import React from 'react'
import './globals.css'
import HeaderWithCart from './HeaderWithCart';
import RootProvider from '../RootProvider';

export const metadata = {
    title: 'E-Ticaret Platformu',
    description: 'Rust + Next.js ile E-Ticaret',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="tr">
            <body>
                <RootProvider>
                    <HeaderWithCart />
                    <main className="container mx-auto p-4">
                        {children}
                    </main>
                </RootProvider>
            </body>
        </html>
    );
}


