/*
  Move shared product URL from ProductTranslation to Product.
  If translation URLs already exist, take one non-empty URL per product.
*/

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "url" TEXT;

-- Data migration
UPDATE "Product" p
SET "url" = src.url
FROM (
  SELECT pt.product_id, MIN(pt.url) AS url
  FROM "ProductTranslation" pt
  WHERE pt.url IS NOT NULL AND BTRIM(pt.url) <> ''
  GROUP BY pt.product_id
) src
WHERE p.id = src.product_id
  AND (p.url IS NULL OR BTRIM(p.url) = '');

-- AlterTable
ALTER TABLE "ProductTranslation" DROP COLUMN "url";
