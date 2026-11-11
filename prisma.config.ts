import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "tsx prisma/seed.ts"
    },
    datasource: {
        // Koneksi langsung (tanpa pooler) untuk perintah CLI Prisma:
        // migrate, db push, studio, dan seed.
        url: env("DATABASE_URL_UNPOOLED")
    }
});
