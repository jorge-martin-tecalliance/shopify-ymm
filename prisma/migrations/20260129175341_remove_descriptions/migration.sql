/*
  Warnings:

  - You are about to drop the column `description` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `PartType` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `PartType` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `SubCategory` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `SubCategory` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Category" ("createdAt", "id", "name", "updatedAt") SELECT "createdAt", "id", "name", "updatedAt" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE TABLE "new_PartType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subCategoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PartType_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PartType" ("createdAt", "id", "name", "subCategoryId", "updatedAt") SELECT "createdAt", "id", "name", "subCategoryId", "updatedAt" FROM "PartType";
DROP TABLE "PartType";
ALTER TABLE "new_PartType" RENAME TO "PartType";
CREATE UNIQUE INDEX "PartType_subCategoryId_name_key" ON "PartType"("subCategoryId", "name");
CREATE TABLE "new_SubCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
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
