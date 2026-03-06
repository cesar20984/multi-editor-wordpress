"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import styles from './AITiptapEditor.module.css';
import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ExistingPost {
    id: string;
    title: string | null;
    slug: string | null;
    metaTitle: string | null;
    metaDesc: string | null;
    content: string | null;
    featuredImg: string | null;
    wpPostId: number | null;
    siteId: string | null;
    categoryId: string | null;
}

export function AITiptapEditor({ project, settings, existingPost }: { project: any, settings: any, existingPost?: ExistingPost }) {
    const router = useRouter();
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; show: boolean; pos: number } | null>(null);
    const [loadingAI, setLoadingAI] = useState(false);
    const [aiStep, setAiStep] = useState<string | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [loadingFeaturedImg, setLoadingFeaturedImg] = useState(false);
    const [customInstruction, setCustomInstruction] = useState("");
    const [showCustomInput, setShowCustomInput] = useState(false);
    const customInputRef = useRef<HTMLInputElement>(null);
    const [insertInstruction, setInsertInstruction] = useState("");
    const [showInsertInput, setShowInsertInput] = useState(false);
    const insertInputRef = useRef<HTMLInputElement>(null);

    // Toast notification system
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(null), 5000);
    }, []);

    // Draft auto-save
    const [postId, setPostId] = useState<string | null>(existingPost?.id || null);
    // Ref to track postId across closures and avoid race conditions
    const postIdRef = useRef<string | null>(existingPost?.id || null);

    // Update ref whenever state changes (for convenience, though we'll update it manually too)
    useEffect(() => {
        postIdRef.current = postId;
    }, [postId]);

    // Draft auto-save
    const [wpPostId, setWpPostId] = useState<number | null>(existingPost?.wpPostId || null);
    const [savingDraft, setSavingDraft] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isSavingRef = useRef(false);

    // AI Generation States
    const [topic, setTopic] = useState("");
    const [articlePrompt, setArticlePrompt] = useState(settings?.defaultArticlePrompt || "Escribe un artículo detallado sobre...");

    // Form states
    const [title, setTitle] = useState(existingPost?.title || "");
    const [slug, setSlug] = useState(existingPost?.slug || "");
    const [metaTitle, setMetaTitle] = useState(existingPost?.metaTitle || "");
    const [metaDesc, setMetaDesc] = useState(existingPost?.metaDesc || "");

    // Featured image
    const [featuredImage, setFeaturedImage] = useState<string | null>(existingPost?.featuredImg || null);
    const [featuredImageAlt, setFeaturedImageAlt] = useState(existingPost?.title || "");

    // Default siteId to the first site if available
    const [siteId, setSiteId] = useState(existingPost?.siteId || (project.sites.length > 0 ? project.sites[0].id : ""));
    const [categoryId, setCategoryId] = useState(existingPost?.categoryId || "");

    // Ref to store the latest values of all fields to avoid stale closures in saveDraft
    const stateRef = useRef({ title, slug, metaTitle, metaDesc, featuredImage, siteId, categoryId });

    // Update the ref whenever any of the fields change
    useEffect(() => {
        stateRef.current = { title, slug, metaTitle, metaDesc, featuredImage, siteId, categoryId };
    }, [title, slug, metaTitle, metaDesc, featuredImage, siteId, categoryId]);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image,
            Placeholder.configure({
                placeholder: 'Escribe tu publicación aquí, o selecciona texto para usar IA...',
            }),
        ],
        content: existingPost?.content || '',
        immediatelyRender: false,
    });

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        if (!editor) return;
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            show: true,
            pos: editor.state.selection.from
        });
    }, [editor]);

    const contextMenuRef = useRef<HTMLDivElement>(null);

    const closeContextMenu = useCallback(() => {
        if (contextMenu?.show) setContextMenu(null);
    }, [contextMenu]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            // Only close if the click is outside the context menu
            if (contextMenuRef.current && contextMenuRef.current.contains(e.target as Node)) return;
            closeContextMenu();
        };
        document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, [closeContextMenu]);

    // Auto-save draft function
    const saveDraft = useCallback(async () => {
        if (isSavingRef.current) return null;
        if (!editor) return null;

        const currentContent = editor.getHTML();
        const { title: rTitle, slug: rSlug, metaTitle: rMetaTitle, metaDesc: rMetaDesc, featuredImage: rFeaturedImage, siteId: rSiteId, categoryId: rCategoryId } = stateRef.current;

        // Don't save if completely empty AND we already have a postId
        if (!postIdRef.current && !rTitle.trim() && (!currentContent || currentContent === '<p></p>')) return null;

        isSavingRef.current = true;
        setSavingDraft(true);

        try {
            const res = await fetch("/api/posts/draft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: postIdRef.current,
                    projectId: project.id,
                    title: rTitle,
                    slug: rSlug,
                    metaTitle: rMetaTitle,
                    metaDesc: rMetaDesc,
                    content: currentContent,
                    featuredImg: rFeaturedImage,
                    siteId: rSiteId || null,
                    categoryId: rCategoryId || null,
                })
            });

            if (!res.ok) {
                if (res.status === 413) throw new Error("El artículo es demasiado grande (muchas imágenes). Intenta publicar o reducir imágenes.");
                throw new Error(`Error del servidor: ${res.status}`);
            }

            const data = await res.json();
            if (data.success && data.post) {
                if (!postIdRef.current) {
                    postIdRef.current = data.post.id;
                    setPostId(data.post.id);
                    window.history.replaceState(null, '', `/projects/${project.id}/editor/${data.post.id}`);
                }
                const now = new Date();
                setLastSaved(now.toLocaleTimeString());
                return data.post;
            } else {
                throw new Error(data.error || "Error desconocido al guardar");
            }
        } catch (e: any) {
            console.error("Auto-save error:", e);
            showToast("❌ Error al guardar borrador: " + e.message, "error");
        } finally {
            isSavingRef.current = false;
            setSavingDraft(false);
        }
        return null;
    }, [editor, project.id, showToast]);

    // Ensures a draft exists in DB and returns the postId
    // Used before image generation so images always have a valid postId to link to
    const ensurePostId = useCallback(async (): Promise<string | null> => {
        if (postIdRef.current) return postIdRef.current;
        // Force create an empty draft just to get an ID
        try {
            const res = await fetch("/api/posts/draft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: project.id,
                    title: stateRef.current.title || "Sin título",
                    content: editor?.getHTML() || "",
                    siteId: stateRef.current.siteId || null,
                })
            });
            const data = await res.json();
            if (data.success && data.post?.id) {
                postIdRef.current = data.post.id;
                setPostId(data.post.id);
                window.history.replaceState(null, '', `/projects/${project.id}/editor/${data.post.id}`);
                return data.post.id;
            }
        } catch (e) {
            console.error("Error creating draft for image:", e);
        }
        return null;
    }, [editor, project.id]);

    // Saves just the HTML content immediately (used after inserting images)
    const saveContentNow = useCallback(async () => {
        if (!editor || !postIdRef.current) return;
        const content = editor.getHTML();
        try {
            await fetch("/api/posts/draft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: postIdRef.current,
                    projectId: project.id,
                    title: stateRef.current.title || "Sin título",
                    content,
                    featuredImg: stateRef.current.featuredImage,
                    siteId: stateRef.current.siteId || null,
                })
            });
            setLastSaved(new Date().toLocaleTimeString());
        } catch (e) {
            console.error("Error saving content after image insert:", e);
        }
    }, [editor, project.id]);

    // Debounced auto-save: triggers 1.2 seconds after last change
    const scheduleSave = useCallback(() => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            saveDraft();
        }, 1200);
    }, [saveDraft]);

    // Watch for content changes in editor
    useEffect(() => {
        if (!editor) return;
        const handler = () => scheduleSave();
        editor.on('update', handler);
        return () => { editor.off('update', handler); };
    }, [editor, scheduleSave]);

    // Watch for form field changes
    useEffect(() => {
        scheduleSave();
    }, [title, slug, metaTitle, metaDesc, siteId, categoryId, featuredImage]);

    if (!editor) {
        return null;
    }

    const selectedSite = project.sites.find((s: any) => s.id === siteId);

    // AI Text Generation Helper
    const generateAIText = async (promptText: string, type: "rewrite" | "custom", sysMessage?: string) => {
        const res = await fetch("/api/ai/generate-text", {
            method: "POST",
            body: JSON.stringify({
                prompt: promptText,
                type,
                context: type === "rewrite" ? "" : (editor?.getText() || ""),
                systemMessage: sysMessage,
                model: settings?.textModel || "gpt-4o-mini"
            }),
            headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data.text;
    };

    const handleAIGenerateArticle = async () => {
        if (!topic.trim()) return showToast("Por favor ingresa una temática para el artículo.", "error");
        setLoadingAI(true);
        const lang = project.language || settings?.language || "Español";

        try {
            // Step 1: Generate Article Content
            setAiStep("✍️ Generando artículo...");
            const prompt = `${articlePrompt}\n\nTemática: ${topic}\n\nIdioma: ${lang}`;
            const generatedHtml = await generateAIText(prompt, "custom", `Eres un redactor experto para blogs de WordPress. Escribe TODO el contenido en ${lang}. Usa etiquetas HTML apropiadas (h2, h3, p, strong, ul, li). No uses etiquetas html de nivel raiz, ni head, ni body. Solo el contenido principal.`);
            editor.commands.setContent(generatedHtml);

            // Step 2: Generate Title (should include keyword)
            setAiStep("📌 Generando título...");
            const titleSys = (settings?.defaultTitlePrompt || "Eres un experto en SEO. Genera solo un título optimizado (H1). Sin comillas.") + ` Escribe en ${lang}. MUY IMPORTANTE: El título debe centrarse en el tema: "${topic}". Si el tema es una instrucción, extrae la idea principal y haz un título real. NO repitas la instrucción original.`;
            const genTitle = await generateAIText(`Base content context details: ${editor.getText().slice(0, 1500)}`, "custom", titleSys);
            setTitle(genTitle.replace(/["']/g, '').replace(/^Título:|^Title:/i, '').trim());

            // Step 3: Generate Meta Title (should include keyword, catchy but correct)
            setAiStep("🏷️ Generando meta título...");
            const metaTitleSys = (settings?.defaultMetaTitlePrompt || "Genera solo el meta título directo para Google. Sin comillas.") + ` Escribe en ${lang}. Debe ser un Meta Título profesional sobre "${topic}". NO repitas instrucciones.`;
            const genMetaTitle = await generateAIText(`Base content context details: ${editor.getText().slice(0, 1500)}`, "custom", metaTitleSys);
            setMetaTitle(genMetaTitle.replace(/["']/g, '').replace(/^Meta Título:|^Meta Title:/i, '').trim());

            // Step 4: Generate Slug (very concise)
            setAiStep("🔗 Generando URL...");
            const slugSys = `Genera un slug de URL (3-4 palabras) basado en el tema: "${topic}". Minúsculas, guiones, SOLO el slug. Sin prefijos.`;
            const genSlug = await generateAIText(`Contenido: ${genTitle}`, "custom", slugSys);
            setSlug(genSlug.toLowerCase().replace(/["']/g, '').replace(/^Slug:|^URL:/i, '').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').trim());

            // Step 5: Generate Meta Description
            setAiStep("📝 Generando meta descripción...");
            const metaDescSys = (settings?.defaultMetaDescPrompt || "Genera solo la meta descripción directa.") + ` Escribe en ${lang}.`;
            const genMetaDesc = await generateAIText(`Base content context details: ${editor.getText().slice(0, 1500)}`, "custom", metaDescSys);
            setMetaDesc(genMetaDesc.replace(/["']/g, '').replace(/^Meta Descripción:|^Meta Description:/i, '').trim());

            // Dismiss overlay - let user work while image generates
            setAiStep(null);
            setLoadingAI(false);
            showToast("✨ ¡Textos generados! La imagen destacada se está generando...", "success");

            // Update ref manually for the immediate save
            stateRef.current = {
                ...stateRef.current,
                title: genTitle.replace(/["']/g, '').replace(/^Título:|^Title:/i, '').trim(),
                slug: genSlug.toLowerCase().replace(/["']/g, '').replace(/^Slug:|^URL:/i, '').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').trim(),
                metaTitle: genMetaTitle.replace(/["']/g, '').replace(/^Meta Título:|^Meta Title:/i, '').trim(),
                metaDesc: genMetaDesc.replace(/["']/g, '').replace(/^Meta Descripción:|^Meta Description:/i, '').trim()
            };
            saveDraft();

            // Step 5: Generate Featured Image in background
            setLoadingFeaturedImg(true);
            try {
                // Ensure we have a postId before generating image
                let currentPostId = postIdRef.current;
                if (!currentPostId) {
                    const savedPost = await saveDraft();
                    currentPostId = savedPost?.id || null;
                }

                const imgRes = await fetch("/api/ai/generate-image", {
                    method: "POST",
                    body: JSON.stringify({
                        contextBefore: `Título del artículo: ${genTitle}\n\nResumen del contenido: ${editor.getText().slice(0, 800)}`,
                        contextAfter: "",
                        wordPressSiteId: siteId,
                        model: settings?.imageModel || "dall-e-3",
                        isFeatured: true,
                        imageSize: settings?.imageSize || "1K",
                        imageAspectRatio: settings?.imageAspectRatio || "1:1",
                        language: lang,
                        postId: currentPostId
                    }),
                    headers: { "Content-Type": "application/json" }
                });
                const imgData = await imgRes.json();
                if (imgData.imageUrl) {
                    setFeaturedImage(imgData.imageUrl);
                    setFeaturedImageAlt(imgData.altText || genTitle);

                    // Force a save after setting the featured image
                    stateRef.current.featuredImage = imgData.imageUrl;
                    await saveDraft();
                    showToast("🖼️ ¡Imagen destacada generada!", "success");
                }
            } catch (imgErr) {
                console.error("Error generando imagen destacada:", imgErr);
                showToast("Error generando imagen destacada", "error");
            }
            setLoadingFeaturedImg(false);
            return;
        } catch (error) {
            console.error(error);
            setAiStep(null);
            showToast("Error al generar artículo. Inténtalo de nuevo.", "error");
        }
        setLoadingAI(false);
    };

    const handleAIGenerateField = async (field: "title" | "metaTitle" | "metaDesc" | "slug") => {
        setLoadingAI(true);
        try {
            const editorText = editor.getText();
            const lang = project.language || settings?.language || "Español";
            let sys = "";
            if (field === "title") sys = (settings?.defaultTitlePrompt || "Genera solo un título SEO directo, sin comillas.") + ` Escribe en ${lang}. MUY IMPORTANTE: Incluye la palabra clave o tema principal: "${topic || editorText.slice(0, 30)}".`;
            if (field === "metaTitle") sys = (settings?.defaultMetaTitlePrompt || "Genera solo el meta título directo, sin comillas.") + ` Escribe en ${lang}. Incluye la palabra clave "${topic || editorText.slice(0, 30)}", sea llamativo pero correcto.`;
            if (field === "metaDesc") sys = (settings?.defaultMetaDescPrompt || "Genera solo la meta descripción directa, sin comillas.") + ` Escribe en ${lang}.`;
            if (field === "slug") sys = `Genera un slug de URL para WordPress MUY resumido (3-4 palabras), minúsculas y separado por guiones. Tema: ${topic || title || editorText.slice(0, 30)}. Idioma: ${lang}. Responde SOLO el slug.`;

            const req = `Base content context details: ${editorText.slice(0, 1500)}`;
            const result = await generateAIText(req, "custom", sys);

            if (field === "title") setTitle(result.replace(/["']/g, '').trim());
            if (field === "metaTitle") setMetaTitle(result.replace(/["']/g, '').trim());
            if (field === "metaDesc") setMetaDesc(result.replace(/["']/g, '').trim());
            if (field === "slug") setSlug(result.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').trim());
        } catch (error) {
            console.error(error);
            showToast(`Error al generar ${field}`, "error");
        }
        setLoadingAI(false);
    };

    const handleAIImprove = async () => {
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, ' ');
        if (!selectedText) return;

        setLoadingAI(true);
        try {
            const result = await generateAIText(selectedText, "rewrite");
            editor.chain().focus().insertContentAt({ from, to }, result).run();
        } catch (error) {
            console.error(error);
            alert("Error al mejorar texto");
        }
        setLoadingAI(false);
    };

    const handleAISpellCheck = async () => {
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, ' ');
        if (!selectedText) return;

        setLoadingAI(true);
        try {
            const sys = `Eres un corrector ortográfico. Tu única tarea es corregir los errores ortográficos y gramaticales del texto que recibas. NO cambies el estilo, NO reorganices frases, NO cambies palabras por sinónimos, NO modifiques la estructura ni los encabezados. Devuelve EXACTAMENTE el mismo texto con solo los errores ortográficos corregidos. Responde únicamente con el texto corregido, sin explicaciones.`;
            const result = await generateAIText(selectedText, "custom", sys);
            editor.chain().focus().insertContentAt({ from, to }, result).run();
        } catch (error) {
            console.error(error);
            showToast("Error al corregir ortografía", "error");
        }
        setLoadingAI(false);
    };

    const handleAICustomInstruction = async () => {
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, ' ');
        if (!selectedText || !customInstruction.trim()) return;

        setLoadingAI(true);
        setShowCustomInput(false);
        try {
            const sys = `Aplicar la siguiente instrucción al texto del usuario: "${customInstruction}". Responde SOLO con el texto resultante, sin explicaciones, sin introducciones.`;
            const result = await generateAIText(selectedText, "custom", sys);
            editor.chain().focus().insertContentAt({ from, to }, result).run();
        } catch (error) {
            console.error(error);
            showToast("Error al aplicar la instrucción", "error");
        }
        setCustomInstruction("");
        setLoadingAI(false);
    };

    const handleAIHumanizeSelection = async () => {
        const { from, to } = editor.state.selection;
        // Using getHTML for selection is trickier in Tiptap without a custom slice serializer, 
        // but since this is usually for paragraphs, text is safer for selection. 
        // Wait, Tiptap has editor.view.state.doc.slice(from, to) which isn't easy to HTMLify.
        // Let's just use textBetween for selection, or let the user know images won't be kept in partial selection.
        // Actually, let's use text for selection just like other text tools.
        const selectedText = editor.state.doc.textBetween(from, to, ' ');
        if (!selectedText) return;

        setLoadingAI(true);
        try {
            const basePrompt = settings?.humanizeSelectionPrompt || "Humaniza el siguiente texto para que parezca escrito por una persona real, no por una IA. Escribe con una voz auténtica, cálida, reflexiva y cercana.";
            const sys = `${basePrompt}\n\nResponde SOLO con el texto humanizado, sin explicaciones, sin introducciones. Tienes prohibido omitir partes del texto, solo reescríbelo siguiendo la instrucción.`;
            const result = await generateAIText(selectedText, "custom", sys);
            editor.chain().focus().insertContentAt({ from, to }, result).run();
            showToast("✅ Texto humanizado", "success");
        } catch (error) {
            console.error(error);
            showToast("Error al humanizar el texto", "error");
        }
        setLoadingAI(false);
    };

    const handleAIHumanizeArticle = async () => {
        const fullHTML = editor.getHTML();
        if (!fullHTML || fullHTML === '<p></p>') return showToast("El editor está vacío.", "error");

        setLoadingAI(true);
        try {
            const basePrompt = settings?.humanizeArticlePrompt || "Humaniza el siguiente texto para que parezca escrito por una persona real, no por una IA. Manten las imagenes intactas.";
            const sys = `${basePrompt}\n\nIMPORTANTE: El input contiene etiquetas HTML (<p>, <h2>, <img src="...">). DEBES mantener TODAS las etiquetas HTML, especialmente las imágenes (<img>). Tu salida debe ser HTML válido sin envolverlo en bloques de markdown (\`\`\`html) ni etiquetas globales como <html> o <body>. Responde SOLO con el HTML humanizado. Tienes prohibido omitir imágenes.`;

            // Using full HTML as the "prompt" for the custom model request
            const result = await generateAIText(`Reescribe y humaniza este HTML manteniendo las etiquetas:\n\n${fullHTML}`, "custom", sys);

            // Result comes back as HTML. Clean possible markdown wrapping just in case.
            const cleanResult = result.replace(/```html\n?/gi, '').replace(/```\n?/gi, '').trim();
            editor.commands.setContent(cleanResult);
            showToast("✅ Artículo completo humanizado", "success");
        } catch (error) {
            console.error(error);
            showToast("Error al humanizar el artículo completo", "error");
        }
        setLoadingAI(false);
    };

    const handleAIGenerateImage = async (pos: number) => {
        setLoadingAI(true);
        const textBefore = editor.state.doc.textBetween(Math.max(0, pos - 500), pos, ' ');
        const textAfter = editor.state.doc.textBetween(pos, Math.min(editor.state.doc.content.size, pos + 500), ' ');

        try {
            // Always guarantee a postId exists before image generation
            const currentPostId = await ensurePostId();
            if (!currentPostId) {
                showToast("No se pudo crear el borrador para guardar la imagen", "error");
                setLoadingAI(false);
                return;
            }

            const res = await fetch("/api/ai/generate-image", {
                method: "POST",
                body: JSON.stringify({
                    contextBefore: textBefore,
                    contextAfter: textAfter,
                    wordPressSiteId: siteId,
                    model: settings?.imageModel || "dall-e-3",
                    imageSize: settings?.imageSize || "1K",
                    imageAspectRatio: settings?.imageAspectRatio || "1:1",
                    language: project.language || settings?.language || "Español",
                    postId: currentPostId
                }),
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();
            if (data.imageUrl) {
                editor.chain().focus().insertContentAt(pos, {
                    type: 'image',
                    attrs: { src: data.imageUrl, alt: data.altText, class: 'aligncenter' }
                }).run();

                // Save content immediately after inserting image URL
                await saveContentNow();
            } else {
                showToast(data.error || "Error al generar imagen", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Error al generar imagen", "error");
        }
        setLoadingAI(false);
    };

    // Infographic generation at cursor position
    const handleAIGenerateInfographic = async (pos: number) => {
        setLoadingAI(true);
        const textBefore = editor.state.doc.textBetween(Math.max(0, pos - 500), pos, ' ');
        const textAfter = editor.state.doc.textBetween(pos, Math.min(editor.state.doc.content.size, pos + 500), ' ');

        try {
            // Always guarantee a postId exists before image generation
            const currentPostId = await ensurePostId();
            if (!currentPostId) {
                showToast("No se pudo crear el borrador para guardar la infografía", "error");
                setLoadingAI(false);
                return;
            }

            const res = await fetch("/api/ai/generate-image", {
                method: "POST",
                body: JSON.stringify({
                    contextBefore: textBefore,
                    contextAfter: textAfter,
                    wordPressSiteId: siteId,
                    model: settings?.imageModel || "dall-e-3",
                    imageSize: settings?.imageSize || "1K",
                    imageAspectRatio: settings?.imageAspectRatio || "1:1",
                    language: project.language || settings?.language || "Español",
                    isInfographic: true,
                    postId: currentPostId
                }),
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();
            if (data.imageUrl) {
                editor.chain().focus().insertContentAt(pos, {
                    type: 'image',
                    attrs: { src: data.imageUrl, alt: data.altText, class: 'aligncenter' }
                }).run();

                // Save content immediately after inserting infographic URL
                await saveContentNow();
            } else {
                showToast(data.error || "Error al generar infografía", "error");
            }
        } catch (error) {
            console.error(error);
        }
        setLoadingAI(false);
    };

    const handleAIInsertContent = async (pos: number, instruction: string) => {
        setLoadingAI(true);
        const lang = project.language || settings?.language || "Español";
        const textBefore = editor.state.doc.textBetween(Math.max(0, pos - 600), pos, ' ');
        const textAfter = editor.state.doc.textBetween(pos, Math.min(editor.state.doc.content.size, pos + 400), ' ');
        try {
            const basePrompt = settings?.insertContentPrompt ||
                "Actúa como un experto redactor. Genera el contenido exacto que pide la instrucción: '{INSTRUCTION}'. El contenido se insertará en el medio de un artículo, por lo que debe conectar fluidamente con el texto anterior y posterior.\n\nTEXTO ANTERIOR:\n{BEFORE}\n\nTEXTO POSTERIOR:\n{AFTER}\n\nGenera SOLO el fragmento de código HTML (p, h2, h3, ul, li) del nuevo contenido. No repitas información existente. No incluyas etiquetas raiz como html o body.";

            let sys = basePrompt
                .replace(/{INSTRUCTION}/g, instruction)
                .replace(/{BEFORE}/g, textBefore.slice(-500))
                .replace(/{AFTER}/g, textAfter.slice(0, 500));

            sys += `\n\nPor favor escribe en idioma: ${lang}.`;

            const result = await generateAIText(`Por favor completa la instrucción: ${instruction}`, "custom", sys);
            editor.chain().focus().insertContentAt(pos, result).run();
            showToast("✅ Contenido insertado", "success");
        } catch (error) {
            console.error(error);
            showToast("Error al generar el contenido", "error");
        }
        setLoadingAI(false);
    };

    // Featured Image Generation
    const handleGenerateFeaturedImage = async () => {
        if (!editor.getText().trim() && !title.trim()) {
            return alert("Escribe contenido o un título primero para generar la imagen destacada.");
        }
        setLoadingFeaturedImg(true);
        try {
            // Ensure we have a postId before generating image
            let currentPostId = postIdRef.current;
            if (!currentPostId) {
                const savedPost = await saveDraft();
                currentPostId = savedPost?.id || null;
            }

            const context = title || editor.getText().slice(0, 500);
            const res = await fetch("/api/ai/generate-image", {
                method: "POST",
                body: JSON.stringify({
                    contextBefore: `Título del artículo: ${title}\n\nResumen del contenido: ${editor.getText().slice(0, 800)}`,
                    contextAfter: "",
                    wordPressSiteId: siteId,
                    model: settings?.imageModel || "dall-e-3",
                    isFeatured: true,
                    imageSize: settings?.imageSize || "1K",
                    imageAspectRatio: settings?.imageAspectRatio || "1:1",
                    language: project.language || settings?.language || "Español",
                    postId: currentPostId
                }),
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();
            if (data.imageUrl) {
                setFeaturedImage(data.imageUrl);
                setFeaturedImageAlt(data.altText || title || "Imagen destacada del artículo");

                // Force a save after setting the featured image
                stateRef.current.featuredImage = data.imageUrl;
                await saveDraft();
            } else {
                showToast(data.error || "Error al generar imagen destacada", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Error al generar imagen destacada", "error");
        }
        setLoadingFeaturedImg(false);
    };

    // Handle manual featured image upload
    const handleFeaturedImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setFeaturedImage(reader.result as string);
            setFeaturedImageAlt(title || file.name.replace(/\.[^/.]+$/, ""));
        };
        reader.readAsDataURL(file);
    };

    const handlePublish = async () => {
        if (!siteId) {
            showToast("⚠️ Debes seleccionar un Sitio de publicación.", "error");
            return;
        }
        if (!categoryId) {
            showToast("⚠️ Debes seleccionar una Categoría para publicar.", "error");
            return;
        }
        setIsPublishing(true);

        const formData = new FormData();
        formData.append("projectId", project.id);
        formData.append("siteId", siteId);
        formData.append("categoryId", categoryId);
        formData.append("title", title);
        formData.append("slug", slug);
        formData.append("metaTitle", metaTitle);
        formData.append("metaDesc", metaDesc);
        formData.append("content", editor.getHTML());
        if (postId) {
            formData.append("postId", postId);
        }
        if (wpPostId) {
            formData.append("wpPostId", String(wpPostId));
        }
        if (featuredImage) {
            formData.append("featuredImage", featuredImage);
            formData.append("featuredImageAlt", featuredImageAlt);
        }

        try {
            const res = await fetch("/api/wp/publish", {
                method: "POST",
                body: formData
            });
            const result = await res.json();

            if (result.success) {
                if (result.wpPostId) {
                    setWpPostId(result.wpPostId);
                }
                showToast(wpPostId ? "✅ ¡Actualizado Exitosamente en WordPress!" : "🚀 ¡Publicado Exitosamente en WordPress!", "success");
                setTimeout(() => { window.location.href = `/projects/${project.id}`; }, 2000);
            } else {
                showToast("Error publicando: " + result.error, "error");
            }
        } catch (err: any) {
            showToast("Error en el cliente al publicar.", "error");
            console.error(err);
        }
        setIsPublishing(false);
    };

    // Toast styles
    const toastStyles: Record<string, React.CSSProperties> = {
        success: { background: 'linear-gradient(135deg, #10b981, #059669)', borderColor: '#059669' },
        error: { background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderColor: '#dc2626' },
        info: { background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderColor: '#2563eb' },
    };

    return (
        <>
            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
                    padding: '1rem 1.5rem', borderRadius: '12px', color: '#fff',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)', fontSize: '0.95rem', fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '300px',
                    animation: 'slideIn 0.3s ease-out',
                    border: '1px solid', ...toastStyles[toast.type]
                }}>
                    <span style={{ fontSize: '1.3rem' }}>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
                    <span style={{ flex: 1 }}>{toast.message}</span>
                    <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.7 }}>×</button>
                </div>
            )}

            {/* AI Progress Overlay */}
            {aiStep && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.95))',
                        border: '1px solid var(--glass-border)', borderRadius: '16px',
                        padding: '2.5rem 3rem', textAlign: 'center',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'pulse 1.5s ease-in-out infinite' }}>✨</div>
                        <p style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Generando con IA</p>
                        <p style={{ fontSize: '1rem', color: 'var(--accent-color)' }}>{aiStep}</p>
                        <div style={{ marginTop: '1.5rem', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: 'var(--accent-color)', borderRadius: '2px', animation: 'loading 2s ease-in-out infinite', width: '60%' }} />
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
                @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
            `}</style>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link href={`/projects/${project.id}`} style={{ color: 'var(--accent-color)' }}>
                        &larr; Volver al Proyecto
                    </Link>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <button
                            onClick={() => saveDraft()}
                            disabled={savingDraft}
                            style={{
                                background: 'rgba(59, 130, 246, 0.15)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                color: '#60a5fa',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600
                            }}
                        >
                            💾 Guardar Borrador
                        </button>
                        {savingDraft && <span style={{ color: '#f59e0b' }}>⛏ Guardando...</span>}
                        {!savingDraft && lastSaved && <span style={{ color: 'var(--success-color)' }}>✓ Guardado {lastSaved}</span>}
                        {existingPost?.wpPostId && <span style={{ background: 'rgba(16,185,129,0.2)', color: 'var(--success-color)', padding: '0.15rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem' }}>WP #{existingPost.wpPostId}</span>}
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1rem' }}>
                    <h3 style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span>✨ Generar Artículo con IA</span>
                        {loadingAI && <span style={{ fontSize: '0.8rem', color: 'var(--accent-color)' }}>Procesando...</span>}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <input
                                type="text"
                                placeholder="Tema o idea principal del artículo..."
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-primary)' }}
                            />
                            <details style={{ fontSize: '0.85rem' }}>
                                <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>Ver/Editar Prompt Predeterminado</summary>
                                <textarea
                                    value={articlePrompt}
                                    onChange={(e) => setArticlePrompt(e.target.value)}
                                    rows={2}
                                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}
                                />
                            </details>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <button onClick={handleAIGenerateArticle} disabled={loadingAI} className="btn-primary" style={{ padding: '0.6rem 1rem' }}>
                                Generar Todo
                            </button>
                            <button onClick={handleAIHumanizeArticle} disabled={loadingAI} className="btn-primary" style={{ padding: '0.4rem 1rem', background: 'linear-gradient(135deg, #10b981, #059669)', fontSize: '0.8rem' }} title="Reescribe TODO el artículo para sonar más humano, manteniendo las imágenes">
                                👤 Humanizar Todo
                            </button>
                        </div>
                    </div>
                </div>

                <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Título (H1)</span>
                                <button onClick={() => handleAIGenerateField("title")} disabled={loadingAI} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.8rem' }}>✨ Generar con IA</button>
                            </div>
                            <input
                                id="post-title"
                                type="text"
                                placeholder="Escribe un título..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                style={{ width: '100%', fontSize: '1.2rem', fontWeight: 'bold', padding: '0.5rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '6px', outline: 'none', color: 'var(--text-primary)', marginBottom: '0.75rem' }}
                            />

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>URL del Artículo (Slug)</span>
                                <button onClick={() => handleAIGenerateField("slug")} disabled={loadingAI} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.8rem' }}>✨ Generar con IA</button>
                            </div>
                            <input
                                id="post-slug"
                                type="text"
                                placeholder="slug-resumido-para-url"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                style={{ width: '100%', fontSize: '0.9rem', padding: '0.4rem', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--glass-border)', borderRadius: '6px', outline: 'none', color: 'var(--text-primary)' }}
                            />
                        </div>
                    </div>

                    <div className={styles.editorWrapper} onContextMenu={handleContextMenu} style={{ flex: 1, overflowY: 'auto', background: '#ffffff', color: '#000000', borderRadius: '0 0 12px 12px' }}>
                        <div className={styles.toolbar} style={{ opacity: loadingAI ? 0.5 : 1, pointerEvents: loadingAI ? 'none' : 'auto', background: '#f1f1f1', borderBottom: '1px solid #ccc' }}>
                            <button onClick={() => editor.chain().focus().toggleBold().run()} className={`${styles.toolbarBtn} ${editor.isActive('bold') ? styles.toolbarBtnActive : ''}`} style={{ color: '#000' }}>Bold</button>
                            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`${styles.toolbarBtn} ${editor.isActive('italic') ? styles.toolbarBtnActive : ''}`} style={{ color: '#000' }}>Italic</button>
                            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`${styles.toolbarBtn} ${editor.isActive('heading', { level: 2 }) ? styles.toolbarBtnActive : ''}`} style={{ color: '#000' }}>H2</button>
                            <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`${styles.toolbarBtn} ${editor.isActive('heading', { level: 3 }) ? styles.toolbarBtnActive : ''}`} style={{ color: '#000' }}>H3</button>
                            {loadingAI && <span style={{ color: '#000', fontSize: '0.9rem', marginLeft: 'auto', alignSelf: 'center' }}>Procesando IA...</span>}
                        </div>

                        <BubbleMenu editor={editor}>
                            <div className={styles.bubbleMenu} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', flexDirection: 'column', gap: 0, padding: '0.25rem' }}>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <button className={styles.aiBtn} onClick={handleAIImprove} disabled={loadingAI} title="Reescribe el texto seleccionado con mejor redacción">
                                        ✨ {loadingAI ? "Procesando..." : "Mejorar"}
                                    </button>
                                    <button className={styles.aiBtn} onClick={handleAISpellCheck} disabled={loadingAI}
                                        style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 2px 10px rgba(59,130,246,0.3)' }}
                                        title="Solo corrige errores ortográficos, sin cambiar el texto">
                                        🔤 Ortografía
                                    </button>
                                    <button className={styles.aiBtn} onClick={handleAIHumanizeSelection} disabled={loadingAI}
                                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 2px 10px rgba(16,185,129,0.3)' }}
                                        title="Reescribe el texto seleccionado para que suene más cálido y humano">
                                        👤 Humanizar
                                    </button>
                                    <button className={styles.aiBtn} onClick={() => { setShowCustomInput(v => !v); setTimeout(() => customInputRef.current?.focus(), 50); }} disabled={loadingAI}
                                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 2px 10px rgba(139,92,246,0.3)' }}
                                        title="Escribe tu propia instrucción para aplicar al texto">
                                        ⚡ Personalizado
                                    </button>
                                </div>
                                {showCustomInput && (
                                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                                        <input
                                            ref={customInputRef}
                                            type="text"
                                            value={customInstruction}
                                            onChange={e => setCustomInstruction(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleAICustomInstruction(); if (e.key === 'Escape') setShowCustomInput(false); }}
                                            placeholder="Ej: hazlo más formal, resume en 2 frases..."
                                            style={{
                                                flex: 1, padding: '0.3rem 0.6rem',
                                                background: 'rgba(255,255,255,0.1)',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                borderRadius: '6px', color: '#fff',
                                                fontSize: '0.82rem', outline: 'none'
                                            }}
                                        />
                                        <button onClick={handleAICustomInstruction} disabled={!customInstruction.trim() || loadingAI}
                                            style={{
                                                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                                border: 'none', borderRadius: '6px', color: '#fff',
                                                padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600
                                            }}>
                                            Aplicar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </BubbleMenu>

                        <div style={{ flex: 1, padding: '1rem' }}>
                            <EditorContent editor={editor} className={styles.editorContent} />
                        </div>

                        {contextMenu?.show && (
                            <div
                                ref={contextMenuRef}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    position: 'fixed',
                                    top: contextMenu.y,
                                    left: contextMenu.x,
                                    zIndex: 1000,
                                    background: '#1e293b',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    borderRadius: '12px',
                                    boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
                                    padding: '0.5rem',
                                    minWidth: '240px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.25rem',
                                }}
                            >
                                {/* Header label */}
                                <div style={{ padding: '0.4rem 0.6rem 0.25rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    Insertar con IA
                                </div>

                                {/* Image button */}
                                <button
                                    onClick={() => { handleAIGenerateImage(contextMenu.pos); setContextMenu(null); setShowInsertInput(false); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                                        padding: '0.6rem 0.75rem', borderRadius: '8px', border: 'none',
                                        background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2))',
                                        color: '#34d399', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600,
                                        textAlign: 'left', transition: 'background 0.2s',
                                        width: '100%',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.35), rgba(5,150,105,0.35))')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2))')}
                                >
                                    <span style={{ fontSize: '1.1rem' }}>🖼️</span>
                                    <div>
                                        <div>Generar Imagen</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 400 }}>IA crea una imagen contextual</div>
                                    </div>
                                </button>

                                {/* Infographic button */}
                                <button
                                    onClick={() => { handleAIGenerateInfographic(contextMenu.pos); setContextMenu(null); setShowInsertInput(false); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                                        padding: '0.6rem 0.75rem', borderRadius: '8px', border: 'none',
                                        background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.2))',
                                        color: '#60a5fa', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600,
                                        textAlign: 'left', transition: 'background 0.2s',
                                        width: '100%',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.35), rgba(37,99,235,0.35))')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.2))')}
                                >
                                    <span style={{ fontSize: '1.1rem' }}>📊</span>
                                    <div>
                                        <div>Generar Infografía</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 400 }}>IA crea una infografía visual</div>
                                    </div>
                                </button>

                                {/* Separator */}
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0.25rem 0' }} />

                                {/* Insert content button */}
                                <button
                                    onClick={() => { setShowInsertInput(v => !v); setTimeout(() => insertInputRef.current?.focus(), 50); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                                        padding: '0.6rem 0.75rem', borderRadius: '8px', border: 'none',
                                        background: showInsertInput
                                            ? 'linear-gradient(135deg, rgba(139,92,246,0.35), rgba(124,58,237,0.35))'
                                            : 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(124,58,237,0.2))',
                                        color: '#c4b5fd', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600,
                                        textAlign: 'left', transition: 'background 0.2s',
                                        width: '100%',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.35), rgba(124,58,237,0.35))')}
                                    onMouseLeave={e => { if (!showInsertInput) e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(124,58,237,0.2))'; }}
                                >
                                    <span style={{ fontSize: '1.1rem' }}>✍️</span>
                                    <div>
                                        <div>Insertar Contenido</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 400 }}>IA agrega texto, secciones o párrafos</div>
                                    </div>
                                </button>

                                {/* Insert content input */}
                                {showInsertInput && (
                                    <div style={{ padding: '0.25rem 0.1rem 0.1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                        <input
                                            ref={insertInputRef}
                                            type="text"
                                            value={insertInstruction}
                                            onChange={e => setInsertInstruction(e.target.value)}
                                            onKeyDown={async e => {
                                                if (e.key === 'Enter' && insertInstruction.trim()) {
                                                    const pos = contextMenu.pos;
                                                    const instr = insertInstruction;
                                                    setContextMenu(null);
                                                    setInsertInstruction("");
                                                    setShowInsertInput(false);
                                                    await handleAIInsertContent(pos, instr);
                                                }
                                                if (e.key === 'Escape') setShowInsertInput(false);
                                            }}
                                            placeholder="Ej: agrega una sección sobre los beneficios..."
                                            style={{
                                                width: '100%', padding: '0.45rem 0.65rem',
                                                background: 'rgba(255,255,255,0.07)',
                                                border: '1px solid rgba(139,92,246,0.4)',
                                                borderRadius: '8px', color: '#fff',
                                                fontSize: '0.82rem', outline: 'none',
                                                boxSizing: 'border-box',
                                            }}
                                        />
                                        <button
                                            disabled={!insertInstruction.trim() || loadingAI}
                                            onClick={async () => {
                                                const pos = contextMenu.pos;
                                                const instr = insertInstruction;
                                                setContextMenu(null);
                                                setInsertInstruction("");
                                                setShowInsertInput(false);
                                                await handleAIInsertContent(pos, instr);
                                            }}
                                            style={{
                                                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                                border: 'none', borderRadius: '8px', color: '#fff',
                                                padding: '0.45rem', cursor: insertInstruction.trim() ? 'pointer' : 'not-allowed',
                                                fontSize: '0.85rem', fontWeight: 700, opacity: insertInstruction.trim() ? 1 : 0.5,
                                                width: '100%',
                                            }}
                                        >
                                            ⚡ Generar e Insertar
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ flex: 1, overflowY: 'auto' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Configuración de Publicación</h3>

                    {/* Featured Image Section */}
                    <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>🖼️ Imagen Destacada</label>
                        </div>

                        {loadingFeaturedImg ? (
                            <div style={{
                                border: '2px dashed var(--accent-color)',
                                borderRadius: '8px', padding: '2rem',
                                textAlign: 'center', marginBottom: '0.5rem',
                                background: 'rgba(15, 23, 42, 0.4)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem'
                            }}>
                                <div style={{
                                    width: '30px', height: '30px',
                                    border: '3px solid rgba(255,255,255,0.1)',
                                    borderTopColor: 'var(--accent-color)',
                                    borderRadius: '50%',
                                    animation: 'spin 1.5s linear infinite'
                                }} />
                                <p style={{ color: 'var(--accent-color)', fontSize: '0.85rem', fontWeight: 500 }}>
                                    Generando imagen...
                                </p>
                            </div>
                        ) : featuredImage ? (
                            <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                                <img
                                    src={featuredImage}
                                    alt={featuredImageAlt}
                                    style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                                />
                                <button
                                    onClick={() => { setFeaturedImage(null); setFeaturedImageAlt(""); }}
                                    style={{
                                        position: 'absolute', top: '8px', right: '8px',
                                        background: 'rgba(220, 38, 38, 0.9)', color: '#fff',
                                        border: 'none', borderRadius: '50%', width: '28px', height: '28px',
                                        cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >✕</button>
                            </div>
                        ) : (
                            <div style={{
                                border: '2px dashed var(--glass-border)',
                                borderRadius: '8px', padding: '1.5rem',
                                textAlign: 'center', marginBottom: '0.5rem',
                                background: 'rgba(15, 23, 42, 0.3)'
                            }}>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                                    Sin imagen destacada
                                </p>
                            </div>
                        )}

                        <style>{`
                            @keyframes spin { to { transform: rotate(360deg); } }
                        `}</style>

                        <input
                            type="text"
                            placeholder="Alt text de la imagen destacada..."
                            value={featuredImageAlt}
                            onChange={(e) => setFeaturedImageAlt(e.target.value)}
                            style={{
                                width: '100%', padding: '0.5rem', marginBottom: '0.5rem',
                                background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)',
                                borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem'
                            }}
                        />

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={handleGenerateFeaturedImage}
                                disabled={loadingFeaturedImg || loadingAI}
                                className="btn-primary"
                                style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                            >
                                {loadingFeaturedImg ? "Generando..." : "✨ Generar con IA"}
                            </button>
                            <label style={{
                                flex: 1, padding: '0.5rem', fontSize: '0.85rem', textAlign: 'center',
                                background: 'rgba(100, 116, 139, 0.4)', borderRadius: '8px', cursor: 'pointer',
                                color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                📁 Subir Imagen
                                <input type="file" accept="image/*" onChange={handleFeaturedImageUpload} style={{ display: 'none' }} />
                            </label>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Meta Título</label>
                            <button onClick={() => handleAIGenerateField("metaTitle")} disabled={loadingAI} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.8rem' }}>✨ Generar</button>
                        </div>
                        <input
                            type="text"
                            value={metaTitle}
                            onChange={(e) => setMetaTitle(e.target.value)}
                            placeholder="Meta título SEO..."
                            style={{ width: '100%', padding: '0.75rem', marginTop: '0.2rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Meta Descripción</label>
                            <button onClick={() => handleAIGenerateField("metaDesc")} disabled={loadingAI} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.8rem' }}>✨ Generar</button>
                        </div>
                        <textarea
                            rows={3}
                            value={metaDesc}
                            onChange={(e) => setMetaDesc(e.target.value)}
                            placeholder="Breve resumen para SEO..."
                            style={{ width: '100%', padding: '0.75rem', marginTop: '0.2rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem', marginTop: '1.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sitio de Publicación</label>
                        <select
                            value={siteId}
                            onChange={(e) => setSiteId(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                        >
                            <option value="">-- Seleccionar Sitio --</option>
                            {project.sites.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name} ({s.url})</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Categoría</label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                        >
                            <option value="">-- Seleccionar Categoría --</option>
                            {selectedSite && selectedSite.categories.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                </div>

                <button
                    onClick={handlePublish}
                    disabled={isPublishing || !siteId || !categoryId}
                    className="btn-primary"
                    style={{ padding: '1rem', fontSize: '1.1rem', background: isPublishing ? 'gray' : 'var(--success-color)' }}
                >
                    {isPublishing ? "Publicando en WP..." : "Publicar en WordPress"}
                </button>
            </div>
        </>
    );
}
