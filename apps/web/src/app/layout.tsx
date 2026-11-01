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
