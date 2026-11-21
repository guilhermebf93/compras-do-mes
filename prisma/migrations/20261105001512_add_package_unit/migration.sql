/*
  Warnings:

  - Added the required column `packageUnit` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PackageUnit" AS ENUM ('UNIT', 'GRAM', 'KILOGRAM', 'MILLILITER', 'LITER');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "packageUnit" "PackageUnit" NOT NULL;
