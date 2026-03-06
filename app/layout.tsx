import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WP AI Editor Pro",
  description: "Advanced WordPress Content Creator powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <nav className="glass-panel" style={{ margin: '1rem', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px' }}>
          <div style={{ fontWeight: '700', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
            WP AI Editor<span style={{ color: 'var(--accent-color)' }}>.</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <a href="/" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Dashboard</a>
            <a href="/settings" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', textDecoration: 'none' }}>Settings</a>
          </div>
        </nav>
        <main style={{ padding: '0 1rem 2rem 1rem' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
