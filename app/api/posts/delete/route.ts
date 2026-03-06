import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request) {
    try {
        const { postId } = await request.json();

        if (!postId) {
            return NextResponse.json({ error: "postId requerido" }, { status: 400 });
        }

        // Verify the post is a draft (not published) for safety
        const post = await prisma.post.findUnique({ where: { id: postId } });

        if (!post) {
            return NextResponse.json({ error: "Borrador no encontrado" }, { status: 404 });
        }

        if (post.status === 'published') {
            return NextResponse.json(
                { error: "No se pueden eliminar artículos publicados desde aquí" },
                { status: 403 }
            );
        }

        // Delete all linked PostImages first (though cascade would handle it too)
        await (prisma as any).postImage.deleteMany({ where: { postId } });

        // Delete the post itself (cascade will handle PostImages due to schema)
        await prisma.post.delete({ where: { id: postId } });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting draft:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
