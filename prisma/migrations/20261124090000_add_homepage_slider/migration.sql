CREATE TABLE `slider_beranda` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `foto_url` VARCHAR(500) NOT NULL,
  `urutan` INTEGER NOT NULL DEFAULT 0,
  `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `slider_beranda_urutan_idx`(`urutan`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
