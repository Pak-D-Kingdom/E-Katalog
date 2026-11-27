ALTER TABLE `riwayat_perubahan_harga`
  ADD COLUMN `satuan_lama` VARCHAR(40) NULL,
  ADD COLUMN `satuan_baru` VARCHAR(40) NULL,
  ADD COLUMN `satuan_berubah` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `deskripsi_lama` TEXT NULL,
  ADD COLUMN `deskripsi_baru` TEXT NULL,
  ADD COLUMN `deskripsi_berubah` BOOLEAN NOT NULL DEFAULT false;
