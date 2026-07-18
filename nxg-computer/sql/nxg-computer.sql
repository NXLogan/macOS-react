-- NXGos — persistent profiles (per PC + player)
-- Optional: only needed if you use oxmysql.
-- The resource also auto-creates this table when Config.Memory.autoCreateTable = true.

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
