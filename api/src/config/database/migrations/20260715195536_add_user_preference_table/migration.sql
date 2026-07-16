/*
  Warnings:

  - You are about to drop the column `theme` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `theme`;

-- CreateTable
CREATE TABLE `UserPreference` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `theme` VARCHAR(191) NOT NULL DEFAULT 'system',
    `language` VARCHAR(191) NOT NULL DEFAULT 'fr',
    `fontSize` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `reduceAnimations` BOOLEAN NOT NULL DEFAULT false,
    `showReadingTime` BOOLEAN NOT NULL DEFAULT true,
    `showAuthorDetails` BOOLEAN NOT NULL DEFAULT true,
    `hideReadPosts` BOOLEAN NOT NULL DEFAULT false,
    `notifyOnLike` BOOLEAN NOT NULL DEFAULT true,
    `notifyOnContribution` BOOLEAN NOT NULL DEFAULT true,
    `emailNotifications` BOOLEAN NOT NULL DEFAULT false,
    `newsletter` BOOLEAN NOT NULL DEFAULT false,
    `profileVisible` BOOLEAN NOT NULL DEFAULT true,
    `showLikedPosts` BOOLEAN NOT NULL DEFAULT false,
    `showContributions` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserPreference_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserPreference` ADD CONSTRAINT `UserPreference_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
