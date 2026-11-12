-- Existing duplicate pseudonyms must be resolved before applying this migration.
-- Deliberately do not rename or delete user data automatically.
CREATE UNIQUE INDEX `user_pseudo_key` ON `user`(`pseudo`);
