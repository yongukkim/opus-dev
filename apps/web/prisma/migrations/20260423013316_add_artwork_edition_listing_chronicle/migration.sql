-- CreateEnum
CREATE TYPE "ListingMarket" AS ENUM ('PRIMARY', 'SECONDARY');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('OPEN', 'CLOSED_SOLD', 'CLOSED_WITHDRAWN');

-- CreateEnum
CREATE TYPE "ChronicleEventType" AS ENUM ('ISSUED', 'PURCHASED', 'TRANSFERRED', 'WITHDRAWN', 'CORRECTED');

-- CreateEnum
CREATE TYPE "ArtworkReviewStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AudienceCategory" AS ENUM ('MALE', 'FEMALE', 'NONE');

-- CreateEnum
CREATE TYPE "ContentRating" AS ENUM ('GENERAL', 'MATURE', 'EXPLICIT');

-- CreateTable
CREATE TABLE "artworks" (
    "id" TEXT NOT NULL,
    "artist_user_id" TEXT NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "genre" VARCHAR(64),
    "year" INTEGER,
    "description" TEXT,
    "audience_category" "AudienceCategory",
    "content_rating" "ContentRating",
    "edition_mode" VARCHAR(16) NOT NULL,
    "edition_total" INTEGER NOT NULL,
    "numbering_policy" VARCHAR(16) NOT NULL,
    "lock_edition" BOOLEAN NOT NULL DEFAULT false,
    "initial_price_jpy" INTEGER,
    "review_status" "ArtworkReviewStatus",
    "review_note" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_user_id" TEXT,
    "stored_file_ref" VARCHAR(512),
    "stored_file_mime" VARCHAR(128),
    "stored_file_bytes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "editions" (
    "id" TEXT NOT NULL,
    "artwork_id" TEXT NOT NULL,
    "edition_number" INTEGER NOT NULL,
    "edition_total" INTEGER NOT NULL,
    "is_issued" BOOLEAN NOT NULL DEFAULT false,
    "minted_at" TIMESTAMP(3),
    "current_owner_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "editions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "market" "ListingMarket" NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'OPEN',
    "seller_user_id" TEXT NOT NULL,
    "price_jpy" INTEGER NOT NULL,
    "artist_pen_name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "note" TEXT,
    "tags_csv" VARCHAR(512),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chronicle_entries" (
    "id" TEXT NOT NULL,
    "edition_id" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_type" "ChronicleEventType" NOT NULL,
    "from_user_id" TEXT,
    "to_user_id" TEXT,
    "listing_id" TEXT,
    "note" TEXT,
    "prev_entry_id" TEXT,
    "content_hash" VARCHAR(64) NOT NULL,

    CONSTRAINT "chronicle_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artwork_tags" (
    "id" TEXT NOT NULL,
    "artwork_id" TEXT NOT NULL,
    "tag" VARCHAR(64) NOT NULL,

    CONSTRAINT "artwork_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "artworks_artist_user_id_idx" ON "artworks"("artist_user_id");

-- CreateIndex
CREATE INDEX "artworks_review_status_idx" ON "artworks"("review_status");

-- CreateIndex
CREATE INDEX "editions_current_owner_user_id_idx" ON "editions"("current_owner_user_id");

-- CreateIndex
CREATE INDEX "editions_is_issued_idx" ON "editions"("is_issued");

-- CreateIndex
CREATE UNIQUE INDEX "editions_artwork_id_edition_number_key" ON "editions"("artwork_id", "edition_number");

-- CreateIndex
CREATE INDEX "listings_market_status_idx" ON "listings"("market", "status");

-- CreateIndex
CREATE INDEX "listings_edition_id_idx" ON "listings"("edition_id");

-- CreateIndex
CREATE INDEX "listings_seller_user_id_idx" ON "listings"("seller_user_id");

-- CreateIndex
CREATE INDEX "chronicle_entries_edition_id_occurred_at_idx" ON "chronicle_entries"("edition_id", "occurred_at");

-- CreateIndex
CREATE INDEX "chronicle_entries_event_type_idx" ON "chronicle_entries"("event_type");

-- CreateIndex
CREATE INDEX "artwork_tags_tag_idx" ON "artwork_tags"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "artwork_tags_artwork_id_tag_key" ON "artwork_tags"("artwork_id", "tag");

-- AddForeignKey
ALTER TABLE "artworks" ADD CONSTRAINT "artworks_artist_user_id_fkey" FOREIGN KEY ("artist_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artworks" ADD CONSTRAINT "artworks_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editions" ADD CONSTRAINT "editions_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "artworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "editions" ADD CONSTRAINT "editions_current_owner_user_id_fkey" FOREIGN KEY ("current_owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_edition_id_fkey" FOREIGN KEY ("edition_id") REFERENCES "editions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_seller_user_id_fkey" FOREIGN KEY ("seller_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chronicle_entries" ADD CONSTRAINT "chronicle_entries_edition_id_fkey" FOREIGN KEY ("edition_id") REFERENCES "editions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chronicle_entries" ADD CONSTRAINT "chronicle_entries_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chronicle_entries" ADD CONSTRAINT "chronicle_entries_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chronicle_entries" ADD CONSTRAINT "chronicle_entries_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chronicle_entries" ADD CONSTRAINT "chronicle_entries_prev_entry_id_fkey" FOREIGN KEY ("prev_entry_id") REFERENCES "chronicle_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artwork_tags" ADD CONSTRAINT "artwork_tags_artwork_id_fkey" FOREIGN KEY ("artwork_id") REFERENCES "artworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
