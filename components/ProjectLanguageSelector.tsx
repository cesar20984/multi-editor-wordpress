"use client";

import { useState } from "react";

const LANGUAGES = [
    { value: "Español", label: "🇪🇸 Español" },
    { value: "English", label: "🇺🇸 English" },
    { value: "中文 (Mandarín)", label: "🇨🇳 中文 (Mandarín)" },
    { value: "हिन्दी (Hindi)", label: "🇮🇳 हिन्दी (Hindi)" },
    { value: "العربية (Árabe)", label: "🇸🇦 العربية (Árabe)" },
    { value: "Français", label: "🇫🇷 Français" },
    { value: "Português", label: "🇧🇷 Português" },
    { value: "Русский (Ruso)", label: "🇷🇺 Русский (Ruso)" },
    { value: "日本語 (Japonés)", label: "🇯🇵 日本語 (Japonés)" },
    { value: "Deutsch", label: "🇩🇪 Deutsch" },
    { value: "한국어 (Coreano)", label: "🇰🇷 한국어 (Coreano)" },
    { value: "Italiano", label: "🇮🇹 Italiano" },
    { value: "Türkçe (Turco)", label: "🇹🇷 Türkçe (Turco)" },
    { value: "Tiếng Việt (Vietnamita)", label: "🇻🇳 Tiếng Việt (Vietnamita)" },
    { value: "Polski (Polaco)", label: "🇵🇱 Polski (Polaco)" },
    { value: "Nederlands (Holandés)", label: "🇳🇱 Nederlands (Holandés)" },
    { value: "ไทย (Tailandés)", label: "🇹🇭 ไทย (Tailandés)" },
    { value: "Bahasa Indonesia", label: "🇮🇩 Bahasa Indonesia" },
    { value: "فارسی (Persa)", label: "🇮🇷 فارسی (Persa)" },
    { value: "Svenska (Sueco)", label: "🇸🇪 Svenska (Sueco)" },
];

export function ProjectLanguageSelector({ projectId, currentLanguage }: { projectId: string; currentLanguage: string }) {
    const [language, setLanguage] = useState(currentLanguage);
    const [saving, setSaving] = useState(false);

    const handleChange = async (newLang: string) => {
        setLanguage(newLang);
        setSaving(true);
        try {
            await fetch("/api/projects/language", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, language: newLang })
            });
        } catch (e) {
            console.error("Error saving language:", e);
        }
        setSaving(false);
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>🌐 Idioma:</span>
            <select
                value={language}
                onChange={(e) => handleChange(e.target.value)}
                style={{
                    padding: '0.4rem 0.6rem',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                }}
            >
                {LANGUAGES.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                ))}
            </select>
            {saving && <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Guardando...</span>}
        </div>
    );
}
