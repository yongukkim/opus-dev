-- Artist submission guide (6-card onboarding) completion timestamp for /vault/submit gate.
ALTER TABLE "users" ADD COLUMN "artist_submission_guide_completed_at" TIMESTAMP(3);
