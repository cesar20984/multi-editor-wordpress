import { NextResponse } from "next/server";
import OpenAI from "openai";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { contextBefore, contextAfter, articleTitle, wordPressSiteId, model, isFeatured, isInfographic, imageSize, imageAspectRatio, language, postId, customPrompt } = await request.json();
        const settings = await (prisma as any).setting.findFirst();

        const lang = language || settings?.language || "Español";

        if (!process.env.OPENAI_API_KEY && (!model || model.includes("dall-e"))) {
            return NextResponse.json({ error: "OpenAI API Key no configurada" }, { status: 500 });
        }

        const finalModel = model || settings?.imageModel || "dall-e-3";

        // 1. Generate the image prompt based on type
        let imagePrompt = "A beautiful highly detailed illustration";
        let sysPrompt = "";

        if (isInfographic) {
            // INFOGRAPHIC: use default from settings or fallback
            sysPrompt = (settings?.defaultInfographicPrompt || "Create a professional infographic...") + ` Use ${lang} for all text labels.`;
        } else if (isFeatured) {
            // Hero/Featured image: use default from settings (no context needed usually but can use title)
            sysPrompt = (settings?.defaultImagePrompt || "Create a visually stunning hero illustration without text...");
        } else {
            // INTERNAL Post image: use contextual prompt with placeholders
            let internalPrompt = settings?.defaultInternalImagePrompt || "Create an illustration for the context: {BEFORE} and {AFTER}. No text.";
            internalPrompt = internalPrompt
                .replace("{BEFORE}", contextBefore || "artículo")
                .replace("{AFTER}", contextAfter || "artículo");
            sysPrompt = internalPrompt;
        }

        if (customPrompt) {
            sysPrompt += `\n\nCRITICAL USER INSTRUCTION FOR THIS SPECIFIC IMAGE: "${customPrompt}". You MUST enforce this specific instruction.`;
        }

        try {
            const promptResponse = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are an expert prompt engineer for AI image generators (DALL-E, Imagen). Your task is to read the user's instructions and the provided article context, and output ONLY the final, highly descriptive image prompt in ENGLISH. Do NOT output translations, explanations, or quotes. The prompt must be in ENGLISH because image models perform drastically better in English. Always respect the user's stylistic choices (e.g., if they say "real photo, natural, not professional", enforce that in your final prompt). STRICTLY stick to the context provided. Do not hallucinate unrelated subjects like forests unless explicitly mentioned.\n\nUser's Image Guidelines:\n${sysPrompt}`
                    },
                    {
                        role: "user",
                        content: `Article Title / Main Topic:\n${articleTitle || "Unknown"}\n\nArticle Context Before Cursor:\n${contextBefore}\n\nArticle Context After Cursor:\n${contextAfter}`
                    }
                ],
            });
            imagePrompt = promptResponse.choices[0].message.content?.trim() || imagePrompt;
        } catch (e) { /* ignore, keep default prompt */ }

        // 2. Generate the image with the appropriate API
        let imageUrl = "";
        let imgBuffer: any;

        if (finalModel.includes("imagen")) {
            // ---- IMAGEN models use the predict endpoint ----
            const geminiKey = process.env.GEMINI_API_KEY;
            if (!geminiKey) return NextResponse.json({ error: "GEMINI_API_KEY no configurada" }, { status: 500 });

            // Map settings to API values. Using "512" as requested by user
            const apiSize = imageSize === "512px" ? "512" : imageSize;

            const parameters: any = { sampleCount: 1 };
            if (imageAspectRatio || imageSize) {
                // Remove snake_case to avoid "oneof" field error
                parameters.imageConfig = {
                    imageSize: apiSize,
                    aspectRatio: imageAspectRatio
                };
            }

            console.log(`Generating Imagen image with size: ${apiSize} and model: ${finalModel}`);

            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${finalModel}:predict?key=${geminiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    instances: [{ prompt: imagePrompt }],
                    parameters: parameters
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || "Error de Imagen API");

            const b64 = data.predictions?.[0]?.bytesBase64Encoded;
            if (!b64) throw new Error("No image data returned from Imagen");
            imgBuffer = Buffer.from(b64, "base64");

        } else if (finalModel.includes("gemini") || finalModel.includes("nano-banana")) {
            // ---- Native Gemini image models use generateContent with imageConfig ----
            const geminiKey = process.env.GEMINI_API_KEY;
            if (!geminiKey) return NextResponse.json({ error: "GEMINI_API_KEY no configurada" }, { status: 500 });

            const generationConfig: any = {
                responseModalities: ["IMAGE", "TEXT"],
                responseMimeType: "text/plain"
            };

            const apiSize = imageSize === "512px" ? "512" : imageSize;

            if (imageAspectRatio || imageSize) {
                // Map settings to API values. Using "512" as requested by user

                // Only camelCase to avoid "oneof" field error
                generationConfig.imageConfig = {
                    imageSize: apiSize,
                    aspectRatio: imageAspectRatio
                };
            }

            console.log(`Generating Gemini image with size: ${apiSize} and model: ${finalModel}`);

            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${finalModel}:generateContent?key=${geminiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: imagePrompt }] }],
                    generationConfig
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || "Error de Gemini Image API");

            const parts = data.candidates?.[0]?.content?.parts || [];
            const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith("image/"));
            if (!imagePart) throw new Error("No image generated by Gemini");

            imgBuffer = Buffer.from(imagePart.inlineData.data, "base64");
        } else {
            // ---- OpenAI DALL-E ----
            let dallESize = "1024x1024";
            if (imageSize === "512px") dallESize = "512x512";
            else if (imageSize === "1K") dallESize = "1024x1024";

            const imageResponse = await openai.images.generate({
                model: finalModel,
                prompt: imagePrompt,
                n: 1,
                size: dallESize as any,
                response_format: "url",
            });

            if (!imageResponse.data || imageResponse.data.length === 0) {
                throw new Error("No image generated by OpenAI");
            }
            imageUrl = imageResponse.data[0].url || "";
            const imgBufferRes = await fetch(imageUrl);
            imgBuffer = await imgBufferRes.arrayBuffer();
        }

        // 3. Convert to WebP
        // For Gemini, we trust the API to return the requested size (512px, 1K, etc.)
        // so we don't perform mandatory resizing which could be redundant.
        // For DALL-E or other models, we might still want to ensure a certain width.
        let sharpOp = sharp(imgBuffer);

        if (!finalModel.includes("gemini") && !finalModel.includes("nano-banana") && !finalModel.includes("imagen")) {
            let targetWidth = 1024;
            if (imageSize === "512px") targetWidth = 512;
            else if (imageSize === "1K") targetWidth = 1024;
            else if (imageSize === "2K") targetWidth = 2048;
            else if (imageSize === "4K") targetWidth = 4096;

            sharpOp = sharpOp.resize(targetWidth, null, { withoutEnlargement: true, fit: 'inside' });
        }

        const webpBuffer = await sharpOp
            .webp({ quality: 75 })
            .toBuffer();

        // 4. Generate a proper alt text in the selected language
        let altText = isInfographic ? "Infografía" : "Imagen del artículo";
        try {
            const altResponse = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: `Genera un texto alternativo (alt text) corto y descriptivo en ${lang} para una imagen de blog. Máximo 15 palabras. Solo el texto, sin comillas ni explicaciones.` },
                    { role: "user", content: `Contexto del artículo: ${contextBefore?.slice(0, 500) || "artículo de blog"}\nDescripción de la imagen generada: ${imagePrompt}` }
                ],
            });
            altText = altResponse.choices[0].message.content?.replace(/["']/g, '') || altText;
        } catch (e) { /* keep default alt */ }

        const base64Image = `data:image/webp;base64,${webpBuffer.toString("base64")}`;

        // 5. Save to Database for stable persistent URL
        let finalImageUrl = base64Image;

        if (postId) {
            try {
                // Using (prisma as any) to avoid temporary lint if generate hasn't finished
                const savedImage = await (prisma as any).postImage.create({
                    data: {
                        base64Data: base64Image,
                        altText,
                        isFeatured: isFeatured === true,
                        postId,
                        wordPressSiteId: wordPressSiteId || null
                    }
                });
                // Return a proxy URL instead of massive base64
                finalImageUrl = `/api/images/${savedImage.id}`;
            } catch (dbErr) {
                console.error("Error saving image to DB:", dbErr);
                // Fallback to base64 if DB fails
            }
        }

        return NextResponse.json({
            imageUrl: finalImageUrl,
            altText
        });

    } catch (error: any) {
        console.error("AI Image Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
