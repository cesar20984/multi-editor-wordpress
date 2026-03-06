// Creates the PostImage table directly in Neon using raw SQL
// Run with: node create_postimage_table.js

const https = require('https');
const url = require('url');

// Parse the connection string manually to build a simple HTTP call to Neon's API
// Actually, let's use the neon serverless driver approach via fetch
// We'll use the DATABASE_URL directly with a simple TCP connection simulation

// Simplest approach: use the postgres protocol directly
// Since pg isn't installed, let's write the SQL and use prisma CLI differently

const sql = `
CREATE TABLE IF NOT EXISTS "PostImage" (
    "id" TEXT NOT NULL,
    "base64Data" TEXT NOT NULL,
    "altText" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "postId" TEXT NOT NULL,
    "wordPressSiteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostImage_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
DO $$ BEGIN
    ALTER TABLE "PostImage" ADD CONSTRAINT "PostImage_postId_fkey" 
        FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PostImage" ADD CONSTRAINT "PostImage_wordPressSiteId_fkey" 
        FOREIGN KEY ("wordPressSiteId") REFERENCES "WordPressSite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
`;

console.log('SQL to run in Neon console:');
console.log('='.repeat(60));
console.log(sql);
console.log('='.repeat(60));
console.log('\nGo to: https://console.neon.tech -> SQL Editor -> paste and run');
