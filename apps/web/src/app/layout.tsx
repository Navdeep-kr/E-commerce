import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Storefront Ops — E-Commerce Operations Platform',
  description: 'Production-grade operations platform for e-commerce departments.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light bg-white">
      <body className="min-h-screen bg-white font-sans antialiased text-black">
        {children}
      </body>
    </html>
  );
}
