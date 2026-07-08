-- CreateTable
CREATE TABLE "telegram_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "telegram_chat_id" VARCHAR(50),
    "telegram_username" VARCHAR(100),
    "link_code" VARCHAR(10),
    "link_code_expires_at" TIMESTAMP(3),
    "linked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "telegram_links_member_id_key" ON "telegram_links"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_links_telegram_chat_id_key" ON "telegram_links"("telegram_chat_id");

-- CreateIndex
CREATE INDEX "telegram_links_gym_id_idx" ON "telegram_links"("gym_id");

-- AddForeignKey
ALTER TABLE "telegram_links" ADD CONSTRAINT "telegram_links_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telegram_links" ADD CONSTRAINT "telegram_links_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
