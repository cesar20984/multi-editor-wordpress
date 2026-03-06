import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const resolvedParams = await params;
        const imageId = resolvedParams.id;

        const image = await prisma.postImage.findUnique({
            where: { id: imageId }
        });

        if (!image) {
            return new NextResponse("Image not found", { status: 404 });
        }

        // Extract mime type and base64 data
        const matches = image.base64Data.match(/^data:([\w/]+);base64,(.+)$/);
        if (!matches) {
            return new NextResponse("Invalid image data", { status: 500 });
        }

        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable"
            }
        });
    } catch (e: any) {
        return new NextResponse(e.message, { status: 500 });
    }
}
