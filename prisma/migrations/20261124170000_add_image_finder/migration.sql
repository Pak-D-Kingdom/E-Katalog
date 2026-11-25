-- AlterTable
ALTER TABLE `produk` MODIFY `foto_url` TEXT NULL;

-- CreateTable
CREATE TABLE `pencarian_gambar_produk` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `produk_id` INTEGER NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'belum_dicari',
    `query` VARCHAR(500) NULL,
    `jumlah_request` INTEGER NOT NULL DEFAULT 0,
    `percobaan` INTEGER NOT NULL DEFAULT 0,
    `error_terakhir` TEXT NULL,
    `dicari_pada` DATETIME(3) NULL,
    `dipilih_pada` DATETIME(3) NULL,
    `diperbarui_pada` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pencarian_gambar_produk_produk_id_key`(`produk_id`),
    INDEX `pencarian_gambar_produk_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kandidat_gambar_produk` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `produk_id` INTEGER NOT NULL,
    `posisi` INTEGER NOT NULL,
    `judul` VARCHAR(500) NULL,
    `image_url` TEXT NOT NULL,
    `thumbnail_url` TEXT NULL,
    `source_url` TEXT NULL,
    `domain` VARCHAR(191) NULL,
    `provider` VARCHAR(40) NOT NULL DEFAULT 'serpapi',
    `relevansi` INTEGER NOT NULL DEFAULT 0,
    `dipilih` BOOLEAN NOT NULL DEFAULT false,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `kandidat_gambar_produk_produk_id_idx`(`produk_id`),
    INDEX `kandidat_gambar_produk_dipilih_idx`(`dipilih`),
    UNIQUE INDEX `kandidat_gambar_produk_produk_id_posisi_key`(`produk_id`, `posisi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pencarian_gambar_produk` ADD CONSTRAINT `pencarian_gambar_produk_produk_id_fkey` FOREIGN KEY (`produk_id`) REFERENCES `produk`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kandidat_gambar_produk` ADD CONSTRAINT `kandidat_gambar_produk_produk_id_fkey` FOREIGN KEY (`produk_id`) REFERENCES `produk`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
