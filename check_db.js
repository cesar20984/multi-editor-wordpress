const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const posts = await prisma.post.findMany({
            orderBy: { updatedAt: 'desc' },
            take: 3
        });

        posts.forEach(p => {
            console.log(`Post ID: ${p.id}`);
            console.log(`Title: ${p.title}`);
            console.log(`Featured Image Start: ${p.featuredImg?.substring(0, 50)}...`);
            console.log(`Content contains base64: ${p.content?.includes('base64')}`);
            console.log(`Content contains /uploads/: ${p.content?.includes('/uploads/')}`);
            console.log("-------------------");
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
