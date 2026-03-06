import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: Create or update a draft
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, projectId, title, slug, metaTitle, metaDesc, content, featuredImg, siteId, categoryId } = body;

        if (id) {
            // Update existing post/draft
            const updated = await prisma.post.update({
                where: { id },
                data: {
                    title: title || null,
                    slug: slug || null,
                    metaTitle: metaTitle || null,
                    metaDesc: metaDesc || null,
                    content: content || null,
                    featuredImg: featuredImg || null,
                    siteId: siteId || null,
                    categoryId: categoryId || null,
                }
            });
            return NextResponse.json({ success: true, post: updated });
        } else {
            // Create new draft
            const created = await prisma.post.create({
                data: {
                    title: title || null,
                    slug: slug || null,
                    metaTitle: metaTitle || null,
                    metaDesc: metaDesc || null,
                    content: content || null,
                    featuredImg: featuredImg || null,
                    status: "draft",
                    projectId,
                    siteId: siteId || null,
                    categoryId: categoryId || null,
                }
            });
            return NextResponse.json({ success: true, post: created });
        }
    } catch (error: any) {
        console.error("Draft save error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
