import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import { AITiptapEditor } from "@/components/Editor/AITiptapEditor";
import { getSettings } from "@/app/actions/settings";

export default async function NewPostEditorPage({ params }: { params: Promise<{ id: string }> }) {
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

    const settings = await getSettings();

    return (
        <div className={styles.container}>
            <AITiptapEditor project={project} settings={settings} />
        </div>
    );
}
