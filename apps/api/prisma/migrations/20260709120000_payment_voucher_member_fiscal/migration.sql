-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'DRAFT';

-- AlterTable
ALTER TABLE "members" ADD COLUMN "dui" VARCHAR(15),
ADD COLUMN "dui_expiration" DATE,
ADD COLUMN "address" TEXT,
ADD COLUMN "is_taxpayer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "nit" VARCHAR(20),
ADD COLUMN "nrc" VARCHAR(20);

-- AlterTable
ALTER TABLE "payments" ADD COLUMN "voucher_number" VARCHAR(100),
ADD COLUMN "subtotal" DECIMAL(10,2),
ADD COLUMN "tax_amount" DECIMAL(10,2),
ADD COLUMN "voucher_url" TEXT,
ADD COLUMN "voucher_extracted_data" JSONB,
ADD COLUMN "voucher_ai_note" TEXT,
ADD COLUMN "voucher_reviewed_by_staff" BOOLEAN NOT NULL DEFAULT false;
