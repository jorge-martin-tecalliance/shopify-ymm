/*
  Warnings:

  - Added the required column `shop` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shop` to the `PartType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shop` to the `SubCategory` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Category" ("createdAt", "id", "name", "updatedAt") SELECT "createdAt", "id", "name", "updatedAt" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX "Category_shop_name_key" ON "Category"("shop", "name");
CREATE TABLE "new_PartType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "terminologyId" INTEGER,
    "subCategoryId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PartType_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PartType" ("createdAt", "id", "name", "subCategoryId", "terminologyId", "updatedAt") SELECT "createdAt", "id", "name", "subCategoryId", "terminologyId", "updatedAt" FROM "PartType";
DROP TABLE "PartType";
ALTER TABLE "new_PartType" RENAME TO "PartType";
CREATE UNIQUE INDEX "PartType_shop_subCategoryId_name_key" ON "PartType"("shop", "subCategoryId", "name");
CREATE TABLE "new_SubCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SubCategory" ("categoryId", "createdAt", "id", "name", "updatedAt") SELECT "categoryId", "createdAt", "id", "name", "updatedAt" FROM "SubCategory";
DROP TABLE "SubCategory";
ALTER TABLE "new_SubCategory" RENAME TO "SubCategory";
CREATE UNIQUE INDEX "SubCategory_shop_categoryId_name_key" ON "SubCategory"("shop", "categoryId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
