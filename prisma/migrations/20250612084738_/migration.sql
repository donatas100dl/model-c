-- CreateTable
CREATE TABLE `Reservation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `checkin` VARCHAR(191) NOT NULL,
    `checkout` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `roomId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Reservation_id_key`(`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Room` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `number` INTEGER NOT NULL,
    `capacity` INTEGER NOT NULL,
    `floor` INTEGER NOT NULL,
    `room_image` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL,
    `wifi` BOOLEAN NOT NULL DEFAULT false,
    `parking` BOOLEAN NOT NULL DEFAULT false,
    `breakfast` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Room_id_key`(`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
