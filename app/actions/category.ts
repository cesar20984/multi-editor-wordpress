"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function syncCategories(siteId: string, projectId: string) {
    const site = await prisma.wordPressSite.findUnique({
        where: { id: siteId },
    });

    if (!site) throw new Error("Site not found");

    const authString = Buffer.from(`${site.username}:${site.password}`).toString("base64");

    try {
        const res = await fetch(`${site.url}/wp-json/wp/v2/categories?per_page=100`, {
            method: "GET",
            headers: {
                Authorization: `Basic ${authString}`,
            },
        });

        if (!res.ok) {
            throw new Error("Failed to fetch categories from WordPress");
        }

        const categories = await res.json();

        // Upsert categories in DB
        for (const cat of categories) {
            await prisma.category.upsert({
                where: { wpId_siteId: { wpId: cat.id, siteId: site.id } },
                update: { name: cat.name },
                create: {
                    wpId: cat.id,
                    name: cat.name,
                    siteId: site.id,
                },
            });
        }

        revalidatePath(`/projects/${projectId}`);
    } catch (error: any) {
        console.error("Sync error:", error);
        throw new Error("Error syncing categories");
    }
}
