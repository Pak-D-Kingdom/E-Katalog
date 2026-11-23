-- Guard database untuk memastikan konsistensi data harga.
-- Fiks: harga wajib ada, min/max harus kosong.
-- Rentang: harga kosong, min/max wajib ada, dan max >= min.
ALTER TABLE `produk`
  ADD CONSTRAINT `chk_produk_harga` CHECK (
    (
      `jenis_harga` = 'tetap'
      AND `harga` IS NOT NULL
      AND `harga_min` IS NULL
      AND `harga_max` IS NULL
    )
    OR
    (
      `jenis_harga` = 'rentang'
      AND `harga` IS NULL
      AND `harga_min` IS NOT NULL
      AND `harga_max` IS NOT NULL
      AND `harga_max` >= `harga_min`
    )
  );
