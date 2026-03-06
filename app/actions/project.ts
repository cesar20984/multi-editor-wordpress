"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSettings } from "@/app/actions/settings";

export async function createProject(formData: FormData) {
    const name = formData.get("name") as string;
    if (!name || name.trim() === "") return;

    // Get global settings for default language
    const settings = await getSettings();

    const project = await prisma.project.create({
        data: {
            name: name.trim(),
            language: settings?.language || "Español",
        },
    });

    revalidatePath("/");
    redirect(`/projects/${project.id}`);
}

export async function deleteProject(id: string) {
    await prisma.project.delete({
        where: { id }
    });
    revalidatePath("/");
}
