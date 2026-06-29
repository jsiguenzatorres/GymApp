-- GymMonthlyBox: caja del mes del gym (NutriElite benefit)
CREATE TABLE "gym_monthly_boxes" (
  "id"             UUID NOT NULL DEFAULT gen_random_uuid(),
  "gym_id"         UUID NOT NULL,
  "month"          VARCHAR(7) NOT NULL,
  "title"          VARCHAR(150) NOT NULL,
  "description"    TEXT,
  "contents"       JSONB NOT NULL DEFAULT '[]',
  "cover_url"      TEXT,
  "delivery_date"  DATE,
  "is_published"   BOOLEAN NOT NULL DEFAULT false,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "gym_monthly_boxes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "gym_monthly_boxes_gym_id_month_key"
  ON "gym_monthly_boxes"("gym_id", "month");

CREATE INDEX "gym_monthly_boxes_gym_id_is_published_idx"
  ON "gym_monthly_boxes"("gym_id", "is_published");

ALTER TABLE "gym_monthly_boxes"
  ADD CONSTRAINT "gym_monthly_boxes_gym_id_fkey"
  FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BoxDeliveryRequest: solicitud del miembro para la caja del mes
CREATE TABLE "box_delivery_requests" (
  "id"               UUID NOT NULL DEFAULT gen_random_uuid(),
  "gym_id"           UUID NOT NULL,
  "member_id"        UUID NOT NULL,
  "box_id"           UUID NOT NULL,
  "status"           VARCHAR(20) NOT NULL DEFAULT 'REQUESTED',
  "delivery_address" TEXT,
  "notes"            TEXT,
  "requested_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "delivered_at"     TIMESTAMP(3),
  CONSTRAINT "box_delivery_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "box_delivery_requests_member_id_box_id_key"
  ON "box_delivery_requests"("member_id", "box_id");

CREATE INDEX "box_delivery_requests_gym_id_status_requested_at_idx"
  ON "box_delivery_requests"("gym_id", "status", "requested_at" DESC);

ALTER TABLE "box_delivery_requests"
  ADD CONSTRAINT "box_delivery_requests_gym_id_fkey"
  FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "box_delivery_requests"
  ADD CONSTRAINT "box_delivery_requests_member_id_fkey"
  FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "box_delivery_requests"
  ADD CONSTRAINT "box_delivery_requests_box_id_fkey"
  FOREIGN KEY ("box_id") REFERENCES "gym_monthly_boxes"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
