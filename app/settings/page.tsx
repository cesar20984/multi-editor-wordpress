"use client";

import { useState, useEffect, useTransition } from "react";

export default function SettingsPage() {
    const [settings, setSettings] = useState<any>(null);
    const [textModels, setTextModels] = useState<string[]>([]);
    const [imageModels, setImageModels] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form state
    const [textModel, setTextModel] = useState("");
    const [imageModel, setImageModel] = useState("");
    const [imageSize, setImageSize] = useState("1K");
    const [imageAspectRatio, setImageAspectRatio] = useState("1:1");
    const [language, setLanguage] = useState("Español");
    const [defaultArticlePrompt, setDefaultArticlePrompt] = useState("");
    const [defaultTitlePrompt, setDefaultTitlePrompt] = useState("");
    const [defaultMetaTitlePrompt, setDefaultMetaTitlePrompt] = useState("");
    const [defaultMetaDescPrompt, setDefaultMetaDescPrompt] = useState("");
    const [defaultImagePrompt, setDefaultImagePrompt] = useState("");
    const [defaultInternalImagePrompt, setDefaultInternalImagePrompt] = useState("");
    const [defaultInfographicPrompt, setDefaultInfographicPrompt] = useState("");
    const [insertContentPrompt, setInsertContentPrompt] = useState("");
    const [humanizeArticlePrompt, setHumanizeArticlePrompt] = useState("");
    const [humanizeSelectionPrompt, setHumanizeSelectionPrompt] = useState("");

    useEffect(() => {
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                setSettings(data.settings);
                setTextModels(data.textModels);
                setImageModels(data.imageModels);
                setTextModel(data.settings.textModel);
                setImageModel(data.settings.imageModel);
                setImageSize(data.settings.imageSize || "1K");
                setImageAspectRatio(data.settings.imageAspectRatio || "1:1");
                setLanguage(data.settings.language || "Español");
                setDefaultArticlePrompt(data.settings.defaultArticlePrompt);
                setDefaultTitlePrompt(data.settings.defaultTitlePrompt);
                setDefaultMetaTitlePrompt(data.settings.defaultMetaTitlePrompt);
                setDefaultMetaDescPrompt(data.settings.defaultMetaDescPrompt);
                setDefaultImagePrompt(data.settings.defaultImagePrompt);
                setDefaultInternalImagePrompt(data.settings.defaultInternalImagePrompt);
                setDefaultInfographicPrompt(data.settings.defaultInfographicPrompt);
                setInsertContentPrompt(data.settings.insertContentPrompt || "");
                setHumanizeArticlePrompt(data.settings.humanizeArticlePrompt || "");
                setHumanizeSelectionPrompt(data.settings.humanizeSelectionPrompt || "");
                setLoading(false);
            });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaved(false);

        await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: settings.id,
                textModel,
                imageModel,
                imageSize,
                imageAspectRatio,
                language,
                defaultArticlePrompt,
                defaultTitlePrompt,
                defaultMetaTitlePrompt,
                defaultMetaDescPrompt,
                defaultImagePrompt,
                defaultInternalImagePrompt,
                defaultInfographicPrompt,
                insertContentPrompt,
                humanizeArticlePrompt,
                humanizeSelectionPrompt,
            })
        });

        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    if (loading) {
        return (
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 0', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Cargando configuración...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 0' }}>
            <h1 className="title" style={{ marginBottom: '2rem' }}>Configuración Global</h1>

            <form onSubmit={handleSave} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                    General
                </h2>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>🌐 Idioma del Contenido</label>
                    <select value={language} onChange={e => setLanguage(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}>
                        <option value="Español">🇪🇸 Español</option>
                        <option value="English">🇺🇸 English</option>
                        <option value="中文 (Mandarín)">🇨🇳 中文 (Mandarín)</option>
                        <option value="हिन्दी (Hindi)">🇮🇳 हिन्दी (Hindi)</option>
                        <option value="العربية (Árabe)">🇸🇦 العربية (Árabe)</option>
                        <option value="Français">🇫🇷 Français</option>
                        <option value="Português">🇧🇷 Português</option>
                        <option value="Русский (Ruso)">🇷🇺 Русский (Ruso)</option>
                        <option value="日本語 (Japonés)">🇯🇵 日本語 (Japonés)</option>
                        <option value="Deutsch">🇩🇪 Deutsch</option>
                        <option value="한국어 (Coreano)">🇰🇷 한국어 (Coreano)</option>
                        <option value="Italiano">🇮🇹 Italiano</option>
                        <option value="Türkçe (Turco)">🇹🇷 Türkçe (Turco)</option>
                        <option value="Tiếng Việt (Vietnamita)">🇻🇳 Tiếng Việt (Vietnamita)</option>
                        <option value="Polski (Polaco)">🇵🇱 Polski (Polaco)</option>
                        <option value="Nederlands (Holandés)">🇳🇱 Nederlands (Holandés)</option>
                        <option value="ไทย (Tailandés)">🇹🇭 ไทย (Tailandés)</option>
                        <option value="Bahasa Indonesia">🇮🇩 Bahasa Indonesia</option>
                        <option value="فارسی (Persa)">🇮🇷 فارسی (Persa)</option>
                        <option value="Svenska (Sueco)">🇸🇪 Svenska (Sueco)</option>
                    </select>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Todos los textos generados, alt texts e infografías se generarán en este idioma.</p>
                </div>

                <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem', marginTop: '1rem' }}>
                    Modelos de Inteligencia Artificial
                </h2>

                <div style={{ display: 'flex', gap: '2rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: "bold" }}>Modelo de Texto</label>
                        <select name="textModel" value={textModel} onChange={e => setTextModel(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}>
                            {textModels.map(id => (
                                <option key={id} value={id}>{id}</option>
                            ))}
                        </select>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Modelo usado para escribir, reescribir y generar metas.</p>
                    </div>

                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: "bold" }}>Modelo de Imagen</label>
                        <select name="imageModel" value={imageModel} onChange={e => setImageModel(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}>
                            {imageModels.map(id => (
                                <option key={id} value={id}>{id}</option>
                            ))}
                        </select>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Modelo usado para generar imágenes destacadas e internas.</p>
                    </div>
                </div>

                {/* Nano Banana 2 Image Config */}
                {(imageModel.includes('gemini') || imageModel.includes('nano-banana') || imageModel.includes('image')) && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', padding: '1.25rem', marginTop: '0.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>🍌</span> Configuración Nano Banana / Gemini Image
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Estos ajustes aplican solo cuando usas modelos nativos de imagen de Gemini (Nano Banana 2 / gemini-*-image-*).
                        </p>
                        <div style={{ display: 'flex', gap: '2rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Resolución (image_size)</label>
                                <select value={imageSize} onChange={e => setImageSize(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}>
                                    <option value="512px">512px — Baja resolución (rápido)</option>
                                    <option value="1K">1K — Estándar (~1024px)</option>
                                    <option value="2K">2K — Alta resolución (~2048px)</option>
                                    <option value="4K">4K — Ultra alta resolución</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Relación de Aspecto</label>
                                <select value={imageAspectRatio} onChange={e => setImageAspectRatio(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}>
                                    <option value="1:1">1:1 — Cuadrada</option>
                                    <option value="3:4">3:4 — Retrato</option>
                                    <option value="4:3">4:3 — Paisaje</option>
                                    <option value="9:16">9:16 — Vertical (stories)</option>
                                    <option value="16:9">16:9 — Panorámica</option>
                                    <option value="21:9">21:9 — Ultra panorámica</option>
                                    <option value="4:1">4:1 — Banner horizontal</option>
                                    <option value="1:4">1:4 — Banner vertical</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem', marginTop: '1rem' }}>
                    Prompts Predeterminados
                </h2>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: "bold" }}>Generación de Artículo Completo</label>
                    <textarea
                        name="defaultArticlePrompt"
                        rows={3}
                        value={defaultArticlePrompt}
                        onChange={e => setDefaultArticlePrompt(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: "bold" }}>Generación de Título (H1)</label>
                    <textarea
                        name="defaultTitlePrompt"
                        rows={2}
                        value={defaultTitlePrompt}
                        onChange={e => setDefaultTitlePrompt(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: "bold" }}>Generación de Meta Título (SEO)</label>
                    <textarea
                        name="defaultMetaTitlePrompt"
                        rows={2}
                        value={defaultMetaTitlePrompt}
                        onChange={e => setDefaultMetaTitlePrompt(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: "bold" }}>Generación de Meta Descripción (SEO)</label>
                    <textarea
                        name="defaultMetaDescPrompt"
                        rows={2}
                        value={defaultMetaDescPrompt}
                        onChange={e => setDefaultMetaDescPrompt(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: "bold" }}>Generación de Imagen Destacada (Prompt Base)</label>
                    <textarea
                        name="defaultImagePrompt"
                        rows={3}
                        value={defaultImagePrompt}
                        onChange={e => setDefaultImagePrompt(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: "bold" }}>Generación de Imagen Interna (Prompt Contextual)</label>
                    <textarea
                        name="defaultInternalImagePrompt"
                        rows={3}
                        value={defaultInternalImagePrompt}
                        onChange={e => setDefaultInternalImagePrompt(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Usa <b>{"{BEFORE}"}</b> y <b>{"{AFTER}"}</b> en el prompt para insertar el texto anterior y posterior al cursor.
                    </p>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: "bold" }}>Generación de Infografías (Prompt Base)</label>
                    <textarea
                        name="defaultInfographicPrompt"
                        rows={3}
                        value={defaultInfographicPrompt}
                        onChange={e => setDefaultInfographicPrompt(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: "bold" }}>✍️ Insertar Contenido con IA (Clic Derecho)</label>
                    <textarea
                        name="insertContentPrompt"
                        rows={4}
                        value={insertContentPrompt}
                        onChange={e => setInsertContentPrompt(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Controla cómo la IA genera el contenido al usar <b>✍️ Insertar Contenido</b> desde el menú de clic derecho.
                        El sistema le pasa automáticamente el idioma del proyecto y el contexto del artículo.
                    </p>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: "bold" }}>👤 Humanizar Artículo Completo</label>
                    <textarea
                        name="humanizeArticlePrompt"
                        rows={4}
                        value={humanizeArticlePrompt}
                        onChange={e => setHumanizeArticlePrompt(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Transforma el HTML completo del artículo. Es crítico instruir al bot a <b>no modificar ni borrar etiquetas <code>&lt;img&gt;</code></b> para preservar las imágenes.
                    </p>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: "bold" }}>👤 Humanizar Texto Resaltado (Popup)</label>
                    <textarea
                        name="humanizeSelectionPrompt"
                        rows={4}
                        value={humanizeSelectionPrompt}
                        onChange={e => setHumanizeSelectionPrompt(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    />
                </div>

                <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }}>
                    {saving ? "Guardando..." : saved ? "✅ Guardado Exitosamente" : "Guardar Configuración"}
                </button>
            </form>
        </div>
    );
}
