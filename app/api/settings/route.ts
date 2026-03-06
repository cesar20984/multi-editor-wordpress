import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch settings + AI models
export async function GET() {
    try {
        let settings = await prisma.setting.findFirst();
        if (!settings) {
            settings = await prisma.setting.create({ data: {} });
        }

        const openaiKey = process.env.OPENAI_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;

        let textModels: string[] = [];
        let imageModels: string[] = [];

        // OpenAI Models
        if (openaiKey) {
            try {
                const res = await fetch("https://api.openai.com/v1/models", {
                    headers: { "Authorization": `Bearer ${openaiKey}` },
                    cache: 'no-store'
                });
                if (res.ok) {
                    const data = await res.json();
                    const models = data.data as any[];
                    textModels.push(...models.filter(m => m.id.startsWith("gpt-") || m.id.startsWith("o1")).map(m => m.id));
                    imageModels.push(...models.filter(m => m.id.startsWith("dall-e")).map(m => m.id));
                }
            } catch (e) { console.error("OpenAI fetch error:", e); }
        }

        // Gemini Models
        if (geminiKey) {
            try {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    const models = data.models as any[];

                    const geminiText = models
                        .filter(m => m.supportedGenerationMethods?.includes("generateContent"))
                        .map(m => m.name.replace("models/", ""));
                    textModels.push(...geminiText);

                    const geminiImg = models
                        .filter(m => m.name.includes("imagen") || m.name.includes("image") || m.name.includes("nano-banana") || m.supportedGenerationMethods?.includes("predict"))
                        .map(m => m.name.replace("models/", ""))
                        .filter(name => name.includes("imagen") || name.includes("image") || name.includes("nano-banana"));
                    imageModels.push(...geminiImg);
                }
            } catch (e) { console.error("Gemini fetch error:", e); }
        }

        if (textModels.length === 0) textModels = ["gpt-4o", "gpt-4o-mini"];
        if (imageModels.length === 0) imageModels = ["dall-e-3"];

        return NextResponse.json({
            settings,
            textModels: Array.from(new Set(textModels)).sort(),
            imageModels: Array.from(new Set(imageModels)).sort()
        });
    } catch (error: any) {
        console.error("Settings GET error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Save settings
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            id, textModel, imageModel, imageSize, imageAspectRatio, language,
            defaultArticlePrompt, defaultTitlePrompt, defaultMetaTitlePrompt, defaultMetaDescPrompt,
            defaultImagePrompt, defaultInternalImagePrompt, defaultInfographicPrompt, insertContentPrompt
        } = body;

        const updated = await prisma.setting.update({
            where: { id },
            data: {
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
                ...(insertContentPrompt !== undefined && { insertContentPrompt }),
            }
        });

        return NextResponse.json({ success: true, settings: updated });
    } catch (error: any) {
        console.error("Settings POST error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
