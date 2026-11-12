-- Invalidate outstanding temporary reset links before binding tokens to accounts.
-- No user accounts are removed or modified.
DELETE FROM `verification_tokens`;
ALTER TABLE `verification_tokens` ADD COLUMN `userId` INTEGER NOT NULL;
CREATE UNIQUE INDEX `verification_tokens_userId_key` ON `verification_tokens`(`userId`);
ALTER TABLE `verification_tokens` ADD CONSTRAINT `verification_tokens_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
