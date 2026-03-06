const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        await prisma.setting.deleteMany({});
        console.log("Deleted old settings to allow new defaults.");
    } catch (e) {
        console.error(e);
    }
}
run();
