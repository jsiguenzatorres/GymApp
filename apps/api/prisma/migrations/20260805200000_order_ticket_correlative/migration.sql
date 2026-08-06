-- AlterTable
ALTER TABLE "gyms" ADD COLUMN "next_ticket_number" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "marketplace_orders" ADD COLUMN "ticket_number" INTEGER;
ALTER TABLE "marketplace_orders" ADD COLUMN "created_by" UUID;
