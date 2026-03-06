"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function publishPost(data: FormData) {
    const projectId = data.get("projectId") as string;
    const siteId = data.get("siteId") as string;
    const categoryId = data.get("categoryId") as string;
    let content = data.get("content") as string;
    const title = data.get("title") as string || "Sin título";
    const slug = data.get("slug") as string;
    const metaTitle = data.get("metaTitle") as string;
    const metaDesc = data.get("metaDesc") as string;
    const featuredImageBase64 = data.get("featuredImage") as string;
    const featuredImageAlt = data.get("featuredImageAlt") as string || title;

    if (!siteId || !categoryId) {
        throw new Error("Sitio y Categoría son obligatorios.");
    }

    const site = await prisma.wordPressSite.findUnique({
        where: { id: siteId }
    });
    if (!site) throw new Error("Sitio WordPress no encontrado.");

    const category = await prisma.category.findUnique({
        where: { id: categoryId }
    });
    if (!category) throw new Error("Categoría no encontrada.");

    const authString = Buffer.from(`${site.username}:${site.password}`).toString("base64");
    const authHeader = { Authorization: `Basic ${authString}` };

    // Helper: upload image buffer to WP and return media ID + URL
    async function uploadImageToWP(imgBuffer: Buffer, filename: string, contentType: string, altText: string) {
        const mediaRes = await fetch(`${site!.url}/wp-json/wp/v2/media`, {
            method: "POST",
            headers: {
                ...authHeader,
                "Content-Type": contentType,
                "Content-Disposition": `attachment; filename="${filename}"`
            },
            body: new Uint8Array(imgBuffer)
        });

        if (!mediaRes.ok) {
            const errText = await mediaRes.text();
            console.error("Fallo subida imagen:", errText);
            return null;
        }

        const mediaJson = await mediaRes.json();

        // Update alt text and title
        await fetch(`${site!.url}/wp-json/wp/v2/media/${mediaJson.id}`, {
            method: "POST",
            headers: { ...authHeader, "Content-Type": "application/json" },
            body: JSON.stringify({ alt_text: altText, title: { raw: altText } })
        });

        return { id: mediaJson.id, url: mediaJson.source_url };
    }

    // Helper: extract buffer from data URL or DB proxy URL
    async function getImageData(url: string) {
        if (url.startsWith("data:image/")) {
            const match = url.match(/^data:image\/([\w+]+);base64,(.+)$/);
            if (!match) return null;
            return {
                type: match[1],
                buffer: Buffer.from(match[2], 'base64')
            };
        } else if (url.includes("/api/images/")) {
            const id = url.split("/").pop();
            if (!id) return null;
            const dbImg = await prisma.postImage.findUnique({ where: { id } });
            if (!dbImg) return null;
            const match = dbImg.base64Data.match(/^data:image\/([\w+]+);base64,(.+)$/);
            if (!match) return null;
            return {
                type: match[1],
                buffer: Buffer.from(match[2], 'base64')
            };
        }
        return null;
    }

    // 1. Upload featured image if provided
    let featuredMediaId: number | null = null;
    if (featuredImageBase64) {
        try {
            const imgData = await getImageData(featuredImageBase64);
            if (imgData) {
                const filename = `featured-${Date.now()}.${imgData.type}`;
                const result = await uploadImageToWP(imgData.buffer, filename, `image/${imgData.type}`, featuredImageAlt);
                if (result) featuredMediaId = result.id;
            }
        } catch (e) {
            console.error("Error subiendo imagen destacada:", e);
        }
    }

    // 2. Extract and upload internal images (Base64 or Proxy URLs)
    // Matches both data:image/ and /api/images/ patterns
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/gi;
    const matches = [...content.matchAll(imgRegex)];

    for (const match of matches) {
        const fullMatch = match[0];
        const imgSrc = match[1];
        const altText = match[2] || "imagen generada ai";

        if (imgSrc.startsWith("data:image/") || imgSrc.includes("/api/images/")) {
            try {
                const imgData = await getImageData(imgSrc);
                if (imgData) {
                    const filename = `ai-image-${Date.now()}.${imgData.type}`;
                    const result = await uploadImageToWP(imgData.buffer, filename, `image/${imgData.type}`, altText);
                    if (result) {
                        content = content.replace(fullMatch, `<img src="${result.url}" alt="${altText}" class="aligncenter" />`);
                    }
                }
            } catch (e) {
                console.error("Error subiendo imagen interna a WP:", e);
            }
        }
    }

    // 3. Publish to WordPress
    const wpPostData: any = {
        title: title,
        content: content,
        slug: slug || "",
        status: "publish",
        categories: [category.wpId],
        meta: {
            _yoast_wpseo_title: metaTitle || "",
            _yoast_wpseo_metadesc: metaDesc || "",
        }
    };

    // Set featured image if uploaded
    if (featuredMediaId) {
        wpPostData.featured_media = featuredMediaId;
    }

    // Determine if updating existing WP post or creating new one
    const wpPostIdStr = data.get("wpPostId") as string;
    const existingWpPostId = wpPostIdStr ? parseInt(wpPostIdStr) : null;

    let wpResponse;
    if (existingWpPostId) {
        // UPDATE existing WordPress post
        wpResponse = await fetch(`${site.url}/wp-json/wp/v2/posts/${existingWpPostId}`, {
            method: "PUT",
            headers: {
                ...authHeader,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(wpPostData)
        });
    } else {
        // CREATE new WordPress post
        wpResponse = await fetch(`${site.url}/wp-json/wp/v2/posts`, {
            method: "POST",
            headers: {
                ...authHeader,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(wpPostData)
        });
    }

    if (!wpResponse.ok) {
        throw new Error(`Error de WordPress: ${await wpResponse.text()}`);
    }

    const wpResult = await wpResponse.json();
    const newWpPostId = wpResult.id;

    // 4. Save/update state in DB
    const localPostId = data.get("postId") as string;

    if (localPostId) {
        // Update existing local post
        await prisma.post.update({
            where: { id: localPostId },
            data: {
                title,
                slug,
                metaTitle,
                metaDesc,
                content,
                featuredImg: featuredImageBase64 || undefined,
                wpPostId: newWpPostId,
                status: "published",
                siteId,
                categoryId
            }
        });
    } else {
        // Create new local post
        await prisma.post.create({
            data: {
                title,
                slug,
                metaTitle,
                metaDesc,
                content,
                wpPostId: newWpPostId,
                status: "published",
                projectId,
                siteId,
                categoryId
            }
        });
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true, wpPostId: newWpPostId };
}
