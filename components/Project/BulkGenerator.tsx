"use client";

import { useState } from 'react';

export function BulkGenerator({ projectId }: { projectId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [topicList, setTopicList] = useState("");

    const handleBulkGenerate = () => {
        if (!topicList.trim()) return;
        
        const topics = topicList.split('\n').filter(t => t.trim().length > 0);
        topics.forEach(topic => {
            const url = `/projects/${projectId}/editor?topic=${encodeURIComponent(topic.trim())}&autogenerate=true`;
            window.open(url, '_blank');
        });
        
        setIsOpen(false);
        setTopicList("");
    };

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="btn-secondary" style={{ padding: '0.6rem 1rem', background: '#3b82f633', border: '1px solid #3b82f6', color: '#fff' }}>
                🚀 Múltiples Artículos
            </button>

            {isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-primary)' }}>Generación Masiva por Lista</h2>
                            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                            Pega una lista de temas (uno por línea). Al confirmar, se abrirá una nueva pestaña para cada tema en tu navegador, y <strong>automáticamente comenzará el proceso de Generar Todo</strong>.
                            <br/><br/>
                            <span style={{ color: '#f59e0b' }}>⚠️ Asegúrate de autorizar o permitir las <b>ventanas emergentes (pop-ups)</b> en tu navegador.</span>
                        </p>
                        
                        <textarea 
                            value={topicList}
                            onChange={(e) => setTopicList(e.target.value)}
                            placeholder="Tema uno...&#10;Tema dos...&#10;Tema tres..."
                            style={{
                                width: '100%',
                                minHeight: '200px',
                                padding: '1rem',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(15, 23, 42, 0.6)',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                resize: 'vertical',
                                marginBottom: '1.5rem',
                                fontSize: '1rem',
                                lineHeight: 1.5
                            }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button onClick={() => setIsOpen(false)} className="btn-secondary" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>Cancelar</button>
                            <button onClick={handleBulkGenerate} className="btn-primary" disabled={!topicList.trim()}>Generar Múltiples Pestañas</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
