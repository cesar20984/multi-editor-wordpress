import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { AITiptapEditor } from "@/components/Editor/AITiptapEditor";
import { getSettings } from "@/app/actions/settings";

export const dynamic = 'force-dynamic';

export default async function EditPostPage({ params }: { params: Promise<{ id: string; postId: string }> }) {
    const resolvedParams = await params;

    const project = await prisma.project.findUnique({
        where: { id: resolvedParams.id },
        include: {
            sites: {
                include: {
                    categories: true
                }
            }
        }
    });

    if (!project) return notFound();

    const post = await prisma.post.findUnique({
        where: { id: resolvedParams.postId }
    });

    if (!post) return notFound();

    const settings = await getSettings();

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 100px)', gap: '2rem' }}>
            <AITiptapEditor
                project={project}
                settings={settings}
                existingPost={{
                    id: post.id,
                    title: post.title || "",
                    slug: post.slug || "",
                    metaTitle: post.metaTitle || "",
                    metaDesc: post.metaDesc || "",
                    content: post.content || "",
                    featuredImg: post.featuredImg || null,
                    wpPostId: post.wpPostId || null,
                    siteId: post.siteId || "",
                    categoryId: post.categoryId || "",
                }}
            />
        </div>
    );
}
