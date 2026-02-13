/*
  Warnings:

  - The primary key for the `Category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Category` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `PartType` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `PartType` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `subCategoryId` on the `PartType` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `SubCategory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `categoryId` on the `SubCategory` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `id` on the `SubCategory` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Category" ("createdAt", "id", "name", "updatedAt") SELECT "createdAt", "id", "name", "updatedAt" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE TABLE "new_PartType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "subCategoryId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PartType_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PartType" ("createdAt", "id", "name", "subCategoryId", "updatedAt") SELECT "createdAt", "id", "name", "subCategoryId", "updatedAt" FROM "PartType";
DROP TABLE "PartType";
ALTER TABLE "new_PartType" RENAME TO "PartType";
CREATE UNIQUE INDEX "PartType_subCategoryId_name_key" ON "PartType"("subCategoryId", "name");
CREATE TABLE "new_SubCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SubCategory" ("categoryId", "createdAt", "id", "name", "updatedAt") SELECT "categoryId", "createdAt", "id", "name", "updatedAt" FROM "SubCategory";
DROP TABLE "SubCategory";
ALTER TABLE "new_SubCategory" RENAME TO "SubCategory";
CREATE UNIQUE INDEX "SubCategory_categoryId_name_key" ON "SubCategory"("categoryId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
