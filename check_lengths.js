const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const post = await prisma.post.findUnique({ where: { id: 'cmme53ulj0003vhc0wweiwa06' } });
        if (post) {
            console.log('Content length:', post.content?.length);
            console.log('FeaturedImg length:', post.featuredImg?.length);
        } else {
            console.log('Post not found');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
