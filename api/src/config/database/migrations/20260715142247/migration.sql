/*
  Warnings:

  - You are about to drop the `account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `follows` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `account` DROP FOREIGN KEY `account_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `follows` DROP FOREIGN KEY `follows_followee_id_fkey`;

-- DropForeignKey
ALTER TABLE `follows` DROP FOREIGN KEY `follows_follower_id_fkey`;

-- DropTable
DROP TABLE `account`;

-- DropTable
DROP TABLE `follows`;
