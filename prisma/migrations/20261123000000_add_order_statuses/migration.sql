ALTER TABLE `riwayat_pesanan`
  ADD COLUMN `status_pesanan` VARCHAR(40) NOT NULL DEFAULT 'menunggu_konfirmasi',
  ADD COLUMN `status_pembayaran` VARCHAR(40) NOT NULL DEFAULT 'belum_dibayar';

CREATE INDEX `riwayat_pesanan_status_pesanan_idx`
  ON `riwayat_pesanan` (`status_pesanan`);

CREATE INDEX `riwayat_pesanan_status_pembayaran_idx`
  ON `riwayat_pesanan` (`status_pembayaran`);
