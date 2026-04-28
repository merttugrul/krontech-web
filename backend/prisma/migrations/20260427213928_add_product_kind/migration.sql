-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('product', 'solution');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "kind" "ProductKind" NOT NULL DEFAULT 'product';

-- CreateIndex
CREATE INDEX "products_kind_idx" ON "products"("kind");
