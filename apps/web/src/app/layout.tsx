import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://e-commerce-dun-seven-24.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Storefront Ops — E-Commerce Operations Platform',
    template: '%s | Storefront Ops',
  },
  description: 'Mission-critical retail back-office engine: unified orders, real-time wave fulfillment, and double-entry accounting with PostgreSQL Row-Level Security.',
  keywords: [
    'e-commerce operations',
    'order management',
    'inventory control',
    'warehouse fulfillment',
    'Shopify ERP',
    'multi-tenant commerce',
  ],
  authors: [{ name: 'Storefront Ops Engineering Team' }],
  creator: 'Storefront Ops',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    title: 'Storefront Ops — E-Commerce Operations Platform',
    description: 'Mission-critical retail back-office engine for modern multi-channel commerce.',
    siteName: 'Storefront Ops',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Storefront Ops — E-Commerce Operations Platform',
    description: 'Mission-critical retail back-office engine for modern multi-channel commerce.',
  },
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light bg-white" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (typeof window !== 'undefined') {
                  const removeGrAttrs = () => {
                    if (document.body) {
                      document.body.removeAttribute('data-new-gr-c-s-check-loaded');
                      document.body.removeAttribute('data-gr-ext-installed');
                    }
                  };
                  removeGrAttrs();
                  const observer = new MutationObserver(() => removeGrAttrs());
                  observer.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['data-new-gr-c-s-check-loaded', 'data-gr-ext-installed'] });
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className="min-h-screen bg-white font-sans antialiased text-black"
        suppressHydrationWarning
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
      >
        {children}
      </body>
    </html>
  );
}
