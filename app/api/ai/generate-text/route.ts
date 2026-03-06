import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { prompt, context, type, systemMessage, model } = await request.json();

        const finalModel = model || "gpt-4o-mini";

        let sysMsg = "Eres un redactor experto para blogs de WordPress.";
        let userMsg = `Contexto general: ${context}\n\nTexto a procesar:\n${prompt}`;

        if (type === "rewrite") {
            sysMsg = "Tu único trabajo es mejorar y reescribir SOLAMENTE el fragmento de texto que te envían. NO repitas ni incluyas ningún otro contenido del artículo. Devuelve ÚNICAMENTE el texto mejorado del fragmento, sin explicaciones, sin encabezados extras, sin contexto adicional. Si el texto tiene formato HTML, mantenlo.";
            userMsg = prompt; // Solo enviar el fragmento seleccionado, sin contexto del artículo
        } else if (type === "custom") {
            sysMsg = systemMessage || "Sigue estas instrucciones al pie de la letra.";
            userMsg = prompt; // Just send the prompt if it's a direct command
        }

        let resultText = "";

        if (finalModel.includes("gemini")) {
            const geminiKey = process.env.GEMINI_API_KEY;
            if (!geminiKey) return NextResponse.json({ error: "GEMINI_API_KEY no configurada" }, { status: 500 });

            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${finalModel}:generateContent?key=${geminiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    system_instruction: { parts: { text: sysMsg } },
                    contents: [{ parts: [{ text: userMsg }] }]
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || "Error de Gemini API");
            resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } else {
            if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY no configurada" }, { status: 500 });

            const response = await openai.chat.completions.create({
                model: finalModel,
                messages: [
                    { role: "system", content: sysMsg },
                    { role: "user", content: userMsg }
                ],
                temperature: 0.7,
            });
            resultText = response.choices[0].message.content || "";
        }

        return NextResponse.json({ text: resultText });
    } catch (error: any) {
        console.error("AI Text Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
