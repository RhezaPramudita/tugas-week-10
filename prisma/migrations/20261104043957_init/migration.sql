-- CreateTable
CREATE TABLE "tugas" (
    "id" SERIAL NOT NULL,
    "judul" TEXT NOT NULL,
    "matkul" TEXT NOT NULL,
    "deadline" DATE NOT NULL,
    "selesai" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tugas_pkey" PRIMARY KEY ("id")
);
