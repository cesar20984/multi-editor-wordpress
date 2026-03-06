"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addSite(formData: FormData) {
    const projectId = formData.get("projectId") as string;
    const name = formData.get("name") as string;
    let url = formData.get("url") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!projectId || !name || !url || !username || !password) {
        throw new Error("Missing required fields");
    }

    // Ensure URL does not end with a slash for consistency
    if (url.endsWith("/")) {
        url = url.slice(0, -1);
    }

    // Verify credentials with WP REST API
    const authString = Buffer.from(`${username}:${password}`).toString("base64");

    try {
        const res = await fetch(`${url}/wp-json/wp/v2/users/me`, {
            method: "GET",
            headers: {
                Authorization: `Basic ${authString}`,
            },
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("WP API Error:", res.status, errorText);
            throw new Error(`Invalid WordPress credentials or URL. Make sure Application Passwords are enabled.`);
        }

        // Attempt to parse JSON to ensure it's a valid WP response
        const me = await res.json();
        if (!me.id) {
            throw new Error("Invalid response from WordPress.");
        }

        // Credentials are valid, save to DB
        await prisma.wordPressSite.create({
            data: {
                name,
                url,
                username,
                password,
                projectId,
            },
        });

        revalidatePath(`/projects/${projectId}`);
    } catch (error: any) {
        console.error("Error adding site:", error);
        // In a real app we'd return an error state, but for simplicity here we might throw.
        throw new Error(error.message || "Failed to verify WordPress site.");
    }
}
