-- AlterTable
-- Menambahkan dukungan harga rentang pada produk.
-- Produk lama otomatis tetap menggunakan harga fiks lewat default 'tetap'.
ALTER TABLE `produk`
  ADD COLUMN `jenis_harga` VARCHAR(20) NOT NULL DEFAULT 'tetap',
  ADD COLUMN `harga_min` DECIMAL(12, 2) NULL,
  ADD COLUMN `harga_max` DECIMAL(12, 2) NULL,
  MODIFY COLUMN `harga` DECIMAL(12, 2) NULL;
