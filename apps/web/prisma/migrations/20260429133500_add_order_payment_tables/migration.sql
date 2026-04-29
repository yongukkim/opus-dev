-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MOCK', 'STRIPE', 'PAYJP');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('REQUIRES_ACTION', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentEventType" AS ENUM (
  'PAYMENT_INTENT_SUCCEEDED',
  'PAYMENT_INTENT_FAILED',
  'PAYMENT_REFUNDED',
  'PAYMENT_CANCELLED'
);

-- CreateTable
CREATE TABLE "orders" (
  "id" TEXT NOT NULL,
  "idempotency_key" VARCHAR(128) NOT NULL,
  "artwork_id" TEXT,
  "edition_id" TEXT,
  "buyer_user_id" TEXT,
  "seller_user_id" TEXT,
  "title" VARCHAR(256) NOT NULL,
  "currency" VARCHAR(8) NOT NULL DEFAULT 'JPY',
  "amount_jpy" INTEGER NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "provider" "PaymentProvider" NOT NULL DEFAULT 'MOCK',
  "provider_reference" VARCHAR(191),
  "checkout_requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paid_at" TIMESTAMP(3),
  "failed_at" TIMESTAMP(3),
  "cancelled_at" TIMESTAMP(3),
  "refunded_at" TIMESTAMP(3),
  "failure_code" VARCHAR(128),
  "failure_reason_masked" VARCHAR(512),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "provider" "PaymentProvider" NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'REQUIRES_ACTION',
  "amount_jpy" INTEGER NOT NULL,
  "currency" VARCHAR(8) NOT NULL DEFAULT 'JPY',
  "provider_payment_id" VARCHAR(191),
  "captured_at" TIMESTAMP(3),
  "failed_at" TIMESTAMP(3),
  "failure_code" VARCHAR(128),
  "failure_reason_masked" VARCHAR(512),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_events" (
  "id" TEXT NOT NULL,
  "payment_id" TEXT NOT NULL,
  "provider" "PaymentProvider" NOT NULL,
  "event_type" "PaymentEventType" NOT NULL,
  "provider_event_id" VARCHAR(191) NOT NULL,
  "payload_masked" JSONB NOT NULL,
  "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_idempotency_key_key" ON "orders"("idempotency_key");

-- CreateIndex
CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "orders_provider_provider_reference_idx" ON "orders"("provider", "provider_reference");

-- CreateIndex
CREATE INDEX "orders_buyer_user_id_created_at_idx" ON "orders"("buyer_user_id", "created_at");

-- CreateIndex
CREATE INDEX "payments_order_id_created_at_idx" ON "payments"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "payments_provider_provider_payment_id_idx" ON "payments"("provider", "provider_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_events_provider_provider_event_id_key" ON "payment_events"("provider", "provider_event_id");

-- CreateIndex
CREATE INDEX "payment_events_payment_id_received_at_idx" ON "payment_events"("payment_id", "received_at");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_user_id_fkey" FOREIGN KEY ("buyer_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_user_id_fkey" FOREIGN KEY ("seller_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
