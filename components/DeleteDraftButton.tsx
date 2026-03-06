'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteDraftButtonProps {
    postId: string;
    postTitle: string;
}

export function DeleteDraftButton({ postId, postTitle }: DeleteDraftButtonProps) {
    const [deleting, setDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        const confirmed = window.confirm(
            `¿Eliminar el borrador "${postTitle || 'Sin título'}"?\n\nEsto eliminará también todas las imágenes internas vinculadas. Esta acción no se puede deshacer.`
        );
        if (!confirmed) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/posts/delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId }),
            });
            const data = await res.json();
            if (data.success) {
                router.refresh();
            } else {
                alert('Error al eliminar: ' + (data.error || 'Error desconocido'));
            }
        } catch (e) {
            alert('Error de conexión al eliminar el borrador.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={deleting}
            title="Eliminar borrador"
            style={{
                background: 'none',
                border: 'none',
                color: deleting ? 'var(--text-secondary)' : '#f87171',
                padding: 0,
                cursor: deleting ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: 400,
                textDecoration: 'none',
                transition: 'opacity 0.2s ease',
                opacity: deleting ? 0.5 : 1,
            }}
            onMouseEnter={e => { if (!deleting) (e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'none'; }}
        >
            {deleting ? 'Eliminando...' : 'Eliminar'}
        </button>
    );
}
