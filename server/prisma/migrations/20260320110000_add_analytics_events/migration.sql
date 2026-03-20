-- CreateTable
CREATE TABLE "analytics_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "session_id" VARCHAR(120) NOT NULL,
    "source" VARCHAR(20) NOT NULL,
    "event_name" VARCHAR(100) NOT NULL,
    "path" VARCHAR(500),
    "properties" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_analytics_events_event_name" ON "analytics_events"("event_name");

-- CreateIndex
CREATE INDEX "idx_analytics_events_user_id" ON "analytics_events"("user_id");

-- CreateIndex
CREATE INDEX "idx_analytics_events_created_at" ON "analytics_events"("created_at");
