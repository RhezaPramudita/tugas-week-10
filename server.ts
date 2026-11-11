import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient, type Prisma } from "./generated/prisma/client.ts";
import { PrismaNeon } from "@prisma/adapter-neon";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("DATABASE_URL belum diatur. Salin .env.example menjadi .env lalu isi connection string Neon.");
    process.exit(1);
}

// Prisma 7 membutuhkan driver adapter. Untuk Neon, gunakan koneksi pooled
// (hostname mengandung "-pooler") agar koneksi aplikasi lebih efisien.
const adapter = new PrismaNeon({ connectionString });

const prisma = new PrismaClient({ adapter });

// ===== Middleware =====

app.disable("x-powered-by");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ===== Tipe & helper =====

type DataTugas = {
    judul: string;
    matkul: string;
    deadline: string;
    selesai?: boolean | string;
};

type TugasDariDatabase = {
    id: number;
    judul: string;
    matkul: string;
    deadline: Date;
    selesai: boolean;
    createdAt: Date;
    updatedAt: Date;
};

function idTugas(nilai: string): number | null {
    if (!/^\d+$/.test(nilai)) {
        return null;
    }

    const id = Number(nilai);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function nilaiSelesai(nilai: unknown): boolean {
    return nilai === true || nilai === "true" || nilai === "on";
}

function validasiTugas(body: unknown): string | null {
    const data = (body || {}) as Partial<DataTugas>;
    const judul = String(data.judul || "").trim();
    const matkul = String(data.matkul || "").trim();
    const deadline = String(data.deadline || "").trim();

    if (judul.length < 3) {
        return "Judul tugas minimal 3 karakter.";
    }

    if (judul.length > 100) {
        return "Judul tugas maksimal 100 karakter.";
    }

    if (!matkul) {
        return "Mata kuliah wajib dipilih.";
    }

    if (!deadline) {
        return "Deadline wajib diisi.";
    }

    const tanggal = new Date(deadline + "T00:00:00Z");
    const formatValid =
        /^\d{4}-\d{2}-\d{2}$/.test(deadline) &&
        !Number.isNaN(tanggal.getTime()) &&
        tanggal.toISOString().slice(0, 10) === deadline;

    if (!formatValid) {
        return "Format deadline tidak valid. Gunakan format YYYY-MM-DD.";
    }

    return null;
}

// Frontend memakai deadline berupa string YYYY-MM-DD, sedangkan Prisma
// mengembalikan objek Date. Helper ini menjaga bentuk respons API tetap sama.
function keApi(item: TugasDariDatabase) {
    return {
        id: item.id,
        judul: item.judul,
        matkul: item.matkul,
        deadline: item.deadline.toISOString().slice(0, 10),
        selesai: item.selesai
    };
}

// ===== REST API =====

// GET: menampilkan seluruh data tugas
app.get("/api/tugas", async function (req, res) {
    const kataKunci = String(req.query.q || "").trim();
    const status = String(req.query.status || "").trim().toLowerCase();
    const where: Prisma.TugasWhereInput = {};

    if (kataKunci) {
        where.OR = [
            { judul: { contains: kataKunci, mode: "insensitive" } },
            { matkul: { contains: kataKunci, mode: "insensitive" } }
        ];
    }

    if (status === "aktif") {
        where.selesai = false;
    }

    if (status === "selesai") {
        where.selesai = true;
    }

    const hasil = await prisma.tugas.findMany({
        where: where,
        orderBy: { id: "asc" }
    });

    res.json(hasil.map(keApi));
});

// GET: menampilkan satu data tugas berdasarkan id
app.get("/api/tugas/:id", async function (req, res) {
    const id = idTugas(req.params.id);

    if (id === null) {
        return res.status(404).json({ message: "Tugas tidak ditemukan." });
    }

    const item = await prisma.tugas.findUnique({ where: { id: id } });

    if (!item) {
        return res.status(404).json({ message: "Tugas tidak ditemukan." });
    }

    res.json(keApi(item));
});

// POST: menambahkan data melalui form
app.post("/api/tugas", async function (req, res) {
    const pesan = validasiTugas(req.body);

    if (pesan) {
        return res.status(400).json({ message: pesan });
    }

    const data = req.body as DataTugas;

    const baru = await prisma.tugas.create({
        data: {
            judul: String(data.judul).trim(),
            matkul: String(data.matkul).trim(),
            deadline: new Date(String(data.deadline) + "T00:00:00.000Z"),
            selesai: nilaiSelesai(data.selesai)
        }
    });

    res.status(201).json(keApi(baru));
});

// PUT: mengubah data melalui fitur Edit (termasuk status selesai)
app.put("/api/tugas/:id", async function (req, res) {
    const id = idTugas(req.params.id);

    if (id === null) {
        return res.status(404).json({ message: "Tugas tidak ditemukan." });
    }

    const item = await prisma.tugas.findUnique({ where: { id: id } });

    if (!item) {
        return res.status(404).json({ message: "Tugas tidak ditemukan." });
    }

    const pesan = validasiTugas(req.body);

    if (pesan) {
        return res.status(400).json({ message: pesan });
    }

    const data = req.body as DataTugas;

    const diperbarui = await prisma.tugas.update({
        where: { id: id },
        data: {
            judul: String(data.judul).trim(),
            matkul: String(data.matkul).trim(),
            deadline: new Date(String(data.deadline) + "T00:00:00.000Z"),
            selesai: nilaiSelesai(data.selesai)
        }
    });

    res.json(keApi(diperbarui));
});

// DELETE: menghapus data melalui tombol Hapus
app.delete("/api/tugas/:id", async function (req, res) {
    const id = idTugas(req.params.id);

    if (id === null) {
        return res.status(404).json({ message: "Tugas tidak ditemukan." });
    }

    const item = await prisma.tugas.findUnique({ where: { id: id } });

    if (!item) {
        return res.status(404).json({ message: "Tugas tidak ditemukan." });
    }

    await prisma.tugas.delete({ where: { id: id } });
    res.status(204).end();
});

// 404 khusus untuk endpoint API yang tidak dikenal
app.use("/api", function (req, res) {
    res.status(404).json({ message: "Endpoint API tidak ditemukan." });
});

// Penanganan error global
app.use(function (
    err: unknown,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    if (
        typeof err === "object" &&
        err !== null &&
        "type" in err &&
        (err as { type?: string }).type === "entity.parse.failed"
    ) {
        return res.status(400).json({ message: "Format JSON tidak valid." });
    }

    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
});

// ===== Menjalankan server =====

async function mulai() {
    await prisma.$connect();
    console.log("Terhubung ke database Neon.");

    app.listen(PORT, function () {
        console.log("Task Tracker Kuliah berjalan di http://localhost:" + PORT);
    });
}

async function matikan() {
    await prisma.$disconnect();
    process.exit(0);
}

process.on("SIGINT", matikan);
process.on("SIGTERM", matikan);

mulai().catch(function (error) {
    console.error(
        "Gagal terhubung ke database:",
        error instanceof Error ? error.message : error
    );
    process.exit(1);
});
