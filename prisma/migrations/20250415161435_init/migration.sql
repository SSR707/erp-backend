/*
  Warnings:

  - Added the required column `data_of_birth` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('CASH', 'CREDIT_CARD');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "data_of_birth" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "gender" "Gender" NOT NULL;

-- CreateTable
CREATE TABLE "PaymentForStudent" (
    "payment_id" TEXT NOT NULL,
    "type" "PaymentType" NOT NULL,
    "sum" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "student_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,

    CONSTRAINT "PaymentForStudent_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "PaymentForTeacher" (
    "payment_id" TEXT NOT NULL,
    "type" "PaymentType" NOT NULL,
    "sum" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "teacher_id" TEXT NOT NULL,

    CONSTRAINT "PaymentForTeacher_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "images" (
    "image_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "is_worked" BOOLEAN NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "images_pkey" PRIMARY KEY ("image_id")
);

-- AddForeignKey
ALTER TABLE "PaymentForStudent" ADD CONSTRAINT "PaymentForStudent_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentForStudent" ADD CONSTRAINT "PaymentForStudent_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Groups"("group_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentForTeacher" ADD CONSTRAINT "PaymentForTeacher_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
