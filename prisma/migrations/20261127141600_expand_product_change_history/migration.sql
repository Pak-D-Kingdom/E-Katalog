ALTER TABLE `riwayat_perubahan_harga`
  ADD COLUMN `kategori_lama` VARCHAR(191) NULL,
  ADD COLUMN `kategori_baru` VARCHAR(191) NULL,
  ADD COLUMN `subkategori_lama` VARCHAR(191) NULL,
  ADD COLUMN `subkategori_baru` VARCHAR(191) NULL,
  ADD COLUMN `kategori_berubah` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `subkategori_berubah` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `jenis_harga_berubah` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `harga_berubah` BOOLEAN NOT NULL DEFAULT false;

UPDATE `riwayat_perubahan_harga`
SET
  `jenis_harga_berubah` = `jenis_harga_lama` <> `jenis_harga_baru`,
  `harga_berubah` =
    NOT (`harga_lama` <=> `harga_baru`)
    OR NOT (`harga_min_lama` <=> `harga_min_baru`)
    OR NOT (`harga_max_lama` <=> `harga_max_baru`);
