ALTER TABLE `pengaturan_katalog`
  ADD COLUMN `email` VARCHAR(191) NULL,
  ADD COLUMN `hak_cipta` VARCHAR(500) NOT NULL DEFAULT '© 2026 PT DapurKita Solusi Kuliner Internasional. Hak Cipta Dilindungi Undang-Undang.';

UPDATE `pengaturan_katalog`
SET `email` = 'procurement@dapurkita.co.id'
WHERE `email` IS NULL;
