-- Preserve verification logs when a user is deleted by nulling the verifier reference.
ALTER TABLE "VerificationLog" DROP CONSTRAINT "VerificationLog_verifier_id_fkey";

ALTER TABLE "VerificationLog"
ALTER COLUMN "verifier_id" DROP NOT NULL;

ALTER TABLE "VerificationLog"
ADD CONSTRAINT "VerificationLog_verifier_id_fkey"
FOREIGN KEY ("verifier_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
