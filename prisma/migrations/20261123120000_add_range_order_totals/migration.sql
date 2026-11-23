ALTER TABLE `riwayat_pesanan`
  ADD COLUMN `total_harga_max` DECIMAL(12, 2) NULL;

ALTER TABLE `detail_pesanan`
  ADD COLUMN `harga_satuan_max` DECIMAL(12, 2) NULL,
  ADD COLUMN `subtotal_max` DECIMAL(12, 2) NULL;
