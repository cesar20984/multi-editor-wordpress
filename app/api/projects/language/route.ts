import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: Update project language
export async function POST(request: Request) {
    try {
        const { projectId, language } = await request.json();

        if (!projectId || !language) {
            return NextResponse.json({ error: "projectId y language son obligatorios" }, { status: 400 });
        }

        const updated = await prisma.project.update({
            where: { id: projectId },
            data: { language }
        });

        return NextResponse.json({ success: true, project: updated });
    } catch (error: any) {
        console.error("Project language update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
