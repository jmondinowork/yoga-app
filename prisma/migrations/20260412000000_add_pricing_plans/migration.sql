-- CreateTable
CREATE TABLE "PricingPlan" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PricingPlan_slug_key" ON "PricingPlan"("slug");

-- Seed default plans
INSERT INTO "PricingPlan" ("id", "slug", "name", "price", "stripePriceId", "interval", "createdAt", "updatedAt")
VALUES
  ('plan_monthly', 'monthly', 'Mensuel', 22, '', 'month', NOW(), NOW()),
  ('plan_annual', 'annual', 'Annuel', 200, '', 'year', NOW(), NOW());
