import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("DATABASE_URL belum diatur. Salin .env.example menjadi .env lalu isi connection string Neon.");
    process.exit(1);
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

const dataContoh = [
    {
        judul: "Membuat CRUD dengan Express",
        matkul: "Pemrograman Web",
        deadline: new Date("2026-11-10T00:00:00.000Z"),
        selesai: false
    },
    {
        judul: "Latihan normalisasi database",
        matkul: "Basis Data",
        deadline: new Date("2026-11-01T00:00:00.000Z"),
        selesai: false
    },
    {
        judul: "Presentasi kelompok jaringan",
        matkul: "Jaringan Komputer",
        deadline: new Date("2026-11-07T00:00:00.000Z"),
        selesai: false
    },
    {
        judul: "Laporan praktikum sistem operasi",
        matkul: "Sistem Operasi",
        deadline: new Date("2026-10-30T00:00:00.000Z"),
        selesai: true
    }
];

async function main() {
    const jumlah = await prisma.tugas.count();

    if (jumlah > 0) {
        console.log(`Seed dilewati, tabel tugas sudah berisi ${jumlah} data.`);
        return;
    }

    const hasil = await prisma.tugas.createMany({ data: dataContoh });
    console.log(`Seed selesai: ${hasil.count} tugas contoh ditambahkan.`);
}

main()
    .catch(function (error) {
        console.error("Gagal menjalankan seed:", error);
        process.exitCode = 1;
    })
    .finally(async function () {
        await prisma.$disconnect();
    });
