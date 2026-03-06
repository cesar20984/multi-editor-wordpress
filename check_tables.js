const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    await client.connect();
    const res = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
    console.log('Tables in public schema:');
    res.rows.forEach(r => console.log(' -', r.tablename));
    await client.end();
}

main().catch(console.error);
