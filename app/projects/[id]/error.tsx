"use client"; // Error components must be Client Components

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Project page error:", error);
    }, [error]);

    return (
        <div className="glass-panel" style={{ margin: '2rem auto', maxWidth: '600px', padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#f87171' }}>⚠️ Ocurrió un Error</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                {error.message || "Ocurrió un error inesperado al procesar la solicitud."}
            </p>
            <p style={{ marginBottom: '2rem', fontSize: '0.85rem', opacity: 0.7 }}>
                Asegúrate de que tus credenciales de WordPress ("Application Passwords") sean correctas y que la URL esté escrita correctamente. Revisa que el sitio no esté bloqueando las peticiones de la REST API externa.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                    onClick={() => reset()}
                    className="btn-primary"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', padding: '0.6rem 1.2rem', color: 'white', borderRadius: '6px', cursor: 'pointer' }}
                >
                    🔄 Reintentar
                </button>
                <Link
                    href="/"
                    className="btn-primary"
                    style={{ padding: '0.6rem 1.2rem', textDecoration: 'none' }}
                >
                    &larr; Volver al Dashboard
                </Link>
            </div>
        </div>
    );
}
