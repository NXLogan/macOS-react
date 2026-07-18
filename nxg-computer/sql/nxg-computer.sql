-- NXG Computer — persistent profiles (per PC + player)

CREATE TABLE IF NOT EXISTS `nxg_computer_profiles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `computer_id` VARCHAR(64) NOT NULL,
  `identifier` VARCHAR(64) NOT NULL,
  `username` VARCHAR(64) NOT NULL DEFAULT 'NXG User',
  `profile` LONGTEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pc_user` (`computer_id`, `identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Legacy accounts table (kept for compatibility)
CREATE TABLE IF NOT EXISTS `nxg_computer_accounts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `identifier` VARCHAR(64) NOT NULL,
  `username` VARCHAR(64) NOT NULL,
  `settings` LONGTEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `identifier_username` (`identifier`, `username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
