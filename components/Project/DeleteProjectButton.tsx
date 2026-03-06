"use client";

import { deleteProject } from "@/app/actions/project";
import { useState } from "react";

export function DeleteProjectButton({ projectId, projectName }: { projectId: string, projectName: string }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const word = Math.random().toString(36).substring(2, 6).toUpperCase();
        const input = prompt(`Escribe la palabra "${word}" para borrar el proyecto "${projectName}":`);

        if (input === word) {
            setIsDeleting(true);
            try {
                await deleteProject(projectId);
            } catch (err) {
                alert("Error borrando el proyecto.");
                setIsDeleting(false);
            }
        } else if (input !== null) {
            alert("Palabra de seguridad incorrecta. Operación cancelada.");
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
                background: 'var(--error-color)',
                border: '1px solid rgba(255, 0, 0, 0.3)',
                color: 'white',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                zIndex: 10,
                marginLeft: 'auto'
            }}
        >
            {isDeleting ? "Borrando..." : "Borrar"}
        </button>
    );
}
