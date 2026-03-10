"use client";

import { useState } from "react";
import { createProject } from "@/app/actions/project";

export function CreateProjectForm() {
    const [name, setName] = useState("");
    const [confirmed, setConfirmed] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const yoastSnippet = `// esto es para que funcikone la metadescripcion desde el multieditor 

add_action( 'rest_api_init', function () {
    // Definir los tipos de post donde quieres que funcione (ej: post, page, product)
    $post_types = ['post', 'page'];

    foreach ($post_types as $post_type) {
        // 1. Registrar el Título SEO
        register_meta( $post_type, '_yoast_wpseo_title', array(
            'show_in_rest' => true, // Habilita la API
            'single'       => true,
            'type'         => 'string',
            'auth_callback' => function() { 
                return current_user_can( 'edit_posts' ); // Solo usuarios con permiso
            }
        ));

        // 2. Registrar la Meta Descripción
        register_meta( $post_type, '_yoast_wpseo_metadesc', array(
            'show_in_rest' => true,
            'single'       => true,
            'type'         => 'string',
            'auth_callback' => function() { 
                return current_user_can( 'edit_posts' );
            }
        ));
        
        // Opcional: Registrar la palabra clave objetivo (focus keyword)
        register_meta( $post_type, '_yoast_wpseo_focuskw', array(
            'show_in_rest' => true,
            'single'       => true,
            'type'         => 'string',
            'auth_callback' => function() { return current_user_can( 'edit_posts' ); }
        ));
    }
});`;

    const handleCopy = () => {
        navigator.clipboard.writeText(yoastSnippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ width: '100%', marginBottom: '2rem' }}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="glass-panel"
                style={{
                    width: '100%', padding: '1.25rem', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer',
                    background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: 'var(--text-primary)'
                }}
            >
                <span>✚ Crear Nuevo Proyecto</span>
                <span>{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
                <form action={createProject} className="glass-panel" style={{ width: '100%', display: 'flex', flexDirection: 'column', padding: '1.5rem', marginTop: '1rem' }}>

                    <input
                        type="text"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nombre del proyecto..."
                        required
                        style={{
                            marginBottom: '1rem',
                            padding: '0.75rem',
                            background: 'rgba(15, 23, 42, 0.6)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                            width: '100%',
                            outline: 'none',
                            fontSize: '1rem'
                        }}
                    />

                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                            ⚠️ <strong>Importante:</strong> Para que las <strong>Meta Descripciones</strong> y <strong>Meta Títulos</strong> funcionen correctamente en WordPress mediante Yoast SEO, debes copiar el siguiente código y pegarlo en el archivo <code>functions.php</code> de tus sitios web.
                        </p>

                        <div style={{ position: 'relative', background: '#0f172a', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.05)', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>functions.php</span>
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    style={{
                                        background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold'
                                    }}
                                >
                                    {copied ? '✅ ¡Copiado!' : '📋 Copiar Código'}
                                </button>
                            </div>
                            <pre style={{ margin: 0, padding: '0.75rem', maxHeight: '150px', overflowY: 'auto', fontSize: '0.75rem', color: '#e2e8f0', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                                {yoastSnippet}
                            </pre>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                required
                                checked={confirmed}
                                onChange={(e) => setConfirmed(e.target.checked)}
                                style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>He copiado e insertado este código en mis sitios WordPress.</span>
                        </label>
                    </div>

                    <button type="submit" disabled={!name || !confirmed} className="btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', opacity: (!name || !confirmed) ? 0.5 : 1 }}>
                        Crear Proyecto
                    </button>
                </form>
            )}
        </div>
    );
}
