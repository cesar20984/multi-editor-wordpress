"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSettings() {
    let setting = await prisma.setting.findFirst();
    if (!setting) {
        setting = await prisma.setting.create({
            data: {}
        });
    }
    return setting;
}

export async function saveSettings(formData: FormData) {
    const id = formData.get("id") as string;

    await prisma.setting.update({
        where: { id },
        data: {
            defaultArticlePrompt: formData.get("defaultArticlePrompt") as string,
            defaultTitlePrompt: formData.get("defaultTitlePrompt") as string,
            defaultMetaTitlePrompt: formData.get("defaultMetaTitlePrompt") as string,
            defaultMetaDescPrompt: formData.get("defaultMetaDescPrompt") as string,
            textModel: formData.get("textModel") as string,
            imageModel: formData.get("imageModel") as string,
            insertContentPrompt: formData.get("insertContentPrompt") as string,
            humanizeArticlePrompt: formData.get("humanizeArticlePrompt") as string,
            humanizeSelectionPrompt: formData.get("humanizeSelectionPrompt") as string,
        }
    });

    revalidatePath("/settings");
}

export async function getAIModels() {
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    let textModels: string[] = [];
    let imageModels: string[] = [];

    // Fetch OpenAI Models
    if (openaiKey) {
        try {
            const res = await fetch("https://api.openai.com/v1/models", {
                headers: { "Authorization": `Bearer ${openaiKey}` },
                cache: 'no-store'
            });
            if (res.ok) {
                const data = await res.json();
                const openaiModels = data.data as any[];
                const oaText = openaiModels.filter(m => m.id.startsWith("gpt-") || m.id.startsWith("o1")).map(m => m.id);
                const oaImg = openaiModels.filter(m => m.id.startsWith("dall-e")).map(m => m.id);
                textModels = [...textModels, ...oaText];
                imageModels = [...imageModels, ...oaImg];
            }
        } catch (e) {
            console.error("OpenAI model fetch error:", e);
        }
    }

    // Fetch Gemini Models
    if (geminiKey) {
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                const geminiModels = data.models as any[];

                // Models supporting generateContent are text models
                const geminiText = geminiModels
                    .filter(m => m.supportedGenerationMethods?.includes("generateContent"))
                    .map(m => m.name.replace("models/", ""));

                // Models supporting text-to-image or containing "imagen" (Google might add specific methods)
                const geminiImg = geminiModels
                    .filter(m => m.name.includes("imagen") || m.name.includes("vision") || m.name.includes("image") || m.name.includes("nano-banana") || m.supportedGenerationMethods?.includes("predict"))
                    .map(m => m.name.replace("models/", ""))
                    .filter(name => name.includes("imagen") || name.includes("vision") || name.includes("image") || name.includes("nano-banana")); // fallback heuristic

                // For robustness if imagen is not listed yet in regular API
                if (geminiImg.length === 0) {
                    geminiImg.push("imagen-3.0-generate-001");
                }

                textModels = [...textModels, ...geminiText];
                imageModels = [...imageModels, ...geminiImg];
            }
        } catch (e) {
            console.error("Gemini model fetch error:", e);
        }
    }

    if (textModels.length === 0) textModels = ["gpt-4o", "gpt-4o-mini", "gemini-1.5-flash"];
    if (imageModels.length === 0) imageModels = ["dall-e-3"];

    return {
        textModels: Array.from(new Set(textModels)).sort(),
        imageModels: Array.from(new Set(imageModels)).sort()
    };
}
