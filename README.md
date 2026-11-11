# Task Tracker Kuliah

Aplikasi CRUD tugas kuliah untuk tugas Pemrograman Web Minggu 9.
Backend menggunakan **Express + Prisma 7** dengan database **Neon PostgreSQL**,
frontend menggunakan **HTML, CSS, dan JavaScript** tanpa framework.

## Fitur

- **GET** — menampilkan seluruh data tugas pada halaman web.
- **POST** — menambahkan tugas baru melalui form.
- **PUT** — mengubah data tugas melalui modal **Edit**.
- **DELETE** — menghapus tugas melalui tombol **Hapus** dengan konfirmasi.
- Tandai tugas selesai / belum selesai (juga memakai `PUT`).
- Pencarian dan filter status: Semua, Aktif, Selesai.
- Statistik jumlah tugas, validasi form di client dan server, notifikasi toast,
  serta tampilan responsif untuk layar kecil.
- Data tersimpan permanen di Neon PostgreSQL.

## Teknologi

- Node.js + Express 5
- TypeScript untuk backend (dijalankan dengan `tsx`, tanpa build step)
- Prisma ORM 7 + `@prisma/adapter-neon`
- Neon PostgreSQL
- HTML5, CSS3, JavaScript (Fetch API, DOM) untuk frontend

## Struktur Proyek

```
minggu9/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/          # dibuat setelah menjalankan migrate
├── generated/
│   └── prisma/              # hasil prisma generate (tidak di-commit)
├── public/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── screenshots/
├── server.ts
├── prisma.config.ts
├── tsconfig.json
├── .env.example
├── package.json
└── README.md
```

## Cara Menjalankan

### 1. Install dependency

```bash
npm install
```

### 2. Siapkan database Neon

1. Buat project di [Neon](https://neon.tech), lalu buka menu **Connect**.
2. Salin dua connection string:
   - **Pooled** — hostname mengandung `-pooler`, dipakai aplikasi.
   - **Direct/unpooled** — tanpa `-pooler`, dipakai Prisma CLI.
3. Salin `.env.example` menjadi `.env`, lalu isi:

```env
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=15"
DATABASE_URL_UNPOOLED="postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=15"
```

> `.env` berisi kredensial dan tidak boleh di-commit atau dimasukkan ke ZIP.

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Buat tabel di database

```bash
npm run prisma:migrate -- --name init
```

Perintah ini membuat folder `prisma/migrations` dan tabel `tugas` di Neon.

### 5. Isi data contoh

```bash
npm run db:seed
```

Seed hanya berjalan jika tabel `tugas` masih kosong.

### 6. Jalankan aplikasi

```bash
npm start
```

Buka <http://localhost:3000> di browser.

Mode pengembangan dengan auto-restart:

```bash
npm run dev
```

Port dapat diganti lewat environment variable:

```bash
PORT=4000 npm start
```

## Script yang Tersedia

| Script | Perintah | Keterangan |
|---|---|---|
| `npm start` | `tsx server.ts` | Menjalankan server |
| `npm run dev` | `tsx watch server.ts` | Server dengan auto-restart |
| `npm run typecheck` | `tsc --noEmit` | Cek tipe TypeScript |
| `npm run prisma:generate` | `prisma generate` | Generate Prisma Client |
| `npm run prisma:migrate` | `prisma migrate dev` | Membuat/menerapkan migrasi |
| `npm run prisma:deploy` | `prisma migrate deploy` | Menerapkan migrasi yang sudah ada |
| `npm run prisma:studio` | `prisma studio` | Membuka Prisma Studio |
| `npm run db:seed` | `prisma db seed` | Mengisi data contoh |

## Dokumentasi API

Base URL: `http://localhost:3000/api`

| Method | Endpoint | Keterangan | Status |
|---|---|---|---|
| GET | `/tugas` | Mengambil seluruh data tugas | `200` |
| GET | `/tugas/:id` | Mengambil satu tugas berdasarkan id | `200`, `404` |
| POST | `/tugas` | Menambahkan tugas baru | `201`, `400` |
| PUT | `/tugas/:id` | Mengubah seluruh data tugas | `200`, `400`, `404` |
| DELETE | `/tugas/:id` | Menghapus tugas | `204`, `404` |

Query opsional untuk `GET /tugas`:

- `?status=aktif` atau `?status=selesai`
- `?q=kata-kunci` untuk mencari pada judul dan mata kuliah

### Contoh Request

```bash
# GET semua tugas
curl http://localhost:3000/api/tugas

# POST tambah tugas
curl -X POST http://localhost:3000/api/tugas \
  -H "Content-Type: application/json" \
  -d '{"judul":"Belajar Express","matkul":"Pemrograman Web","deadline":"2026-11-20"}'

# PUT ubah tugas
curl -X PUT http://localhost:3000/api/tugas/1 \
  -H "Content-Type: application/json" \
  -d '{"judul":"Belajar Express Dasar","matkul":"Pemrograman Web","deadline":"2026-11-22","selesai":true}'

# DELETE hapus tugas
curl -X DELETE http://localhost:3000/api/tugas/1
```

### Format Data

```json
{
  "id": 1,
  "judul": "Membuat CRUD dengan Express",
  "matkul": "Pemrograman Web",
  "deadline": "2026-11-10",
  "selesai": false
}
```

Validasi server:

- Judul minimal 3 karakter dan maksimal 100 karakter.
- Mata kuliah wajib dipilih.
- Deadline wajib diisi dengan format `YYYY-MM-DD`.

## Model Database

```prisma
model Tugas {
  id        Int      @id @default(autoincrement())
  judul     String
  matkul    String
  deadline  DateTime @db.Date
  selesai   Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt      @map("updated_at")

  @@map("tugas")
}
```

## Catatan

- Prisma 7 mewajibkan driver adapter. Proyek ini memakai `@prisma/adapter-neon`
  dengan koneksi **pooled** (`DATABASE_URL`), sedangkan Prisma CLI memakai
  koneksi **direct** (`DATABASE_URL_UNPOOLED`).
- Folder `generated/prisma` adalah hasil `prisma generate` dan tidak di-commit.
- Proyek tidak memiliki proses build, sehingga tidak ada folder `dist`.
- Setelah mengubah `prisma/schema.prisma`, jalankan ulang:

  ```bash
  npm run prisma:generate
  npm run prisma:migrate -- --name nama_perubahan
  ```

- Neon menghentikan compute setelah tidak aktif. Koneksi pertama bisa terasa
  lambat; parameter `connect_timeout=15` membantu menghindari timeout.

## Screenshot Bukti

| Aksi | File |
|---|---|
| Tampilan web dengan seluruh data (GET) | `screenshots/01-tampilan-utama.png` |
| Menambah data melalui form (POST) | `screenshots/02-post.png` |
| Form Edit dengan data yang diubah (PUT) | `screenshots/03-put-form.png` |
| Hasil setelah data disimpan (PUT) | `screenshots/03-put-hasil.png` |
| Data setelah dihapus (DELETE) | `screenshots/04-delete.png` |
