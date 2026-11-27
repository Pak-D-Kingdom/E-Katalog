CREATE TABLE `riwayat_perubahan_harga` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `produk_id` INTEGER NULL,
  `kode_produk` VARCHAR(80) NOT NULL,
  `nama_produk` VARCHAR(191) NOT NULL,
  `jenis_harga_lama` VARCHAR(20) NOT NULL,
  `harga_lama` DECIMAL(12, 2) NULL,
  `harga_min_lama` DECIMAL(12, 2) NULL,
  `harga_max_lama` DECIMAL(12, 2) NULL,
  `jenis_harga_baru` VARCHAR(20) NOT NULL,
  `harga_baru` DECIMAL(12, 2) NULL,
  `harga_min_baru` DECIMAL(12, 2) NULL,
  `harga_max_baru` DECIMAL(12, 2) NULL,
  `diubah_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `riwayat_perubahan_harga_diubah_pada_idx`(`diubah_pada`),
  INDEX `riwayat_perubahan_harga_kode_produk_idx`(`kode_produk`),
  INDEX `riwayat_perubahan_harga_produk_id_diubah_pada_idx`(`produk_id`, `diubah_pada`),
  PRIMARY KEY (`id`),
  CONSTRAINT `riwayat_perubahan_harga_produk_id_fkey`
    FOREIGN KEY (`produk_id`) REFERENCES `produk`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
