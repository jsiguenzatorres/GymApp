CREATE TABLE "blog_posts" (
  "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
  "gym_id"      UUID NOT NULL,
  "title"       VARCHAR(200) NOT NULL,
  "slug"        VARCHAR(200) NOT NULL,
  "excerpt"     TEXT,
  "content_md"  TEXT NOT NULL,
  "cover_url"   TEXT,
  "author_name" VARCHAR(100),
  "category"    VARCHAR(50),
  "tags"        TEXT[],
  "is_published" BOOLEAN NOT NULL DEFAULT false,
  "published_at" TIMESTAMP(3),
  "views_count"  INTEGER NOT NULL DEFAULT 0,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "blog_posts_gym_id_slug_key" ON "blog_posts"("gym_id", "slug");
CREATE INDEX "blog_posts_gym_id_is_published_published_at_idx"
  ON "blog_posts"("gym_id", "is_published", "published_at" DESC);
