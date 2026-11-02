-- Login passa a ser feito pelo Supabase Auth: remove senha, ativação e códigos
-- próprios e vincula cada instituição ao usuário do Supabase (auth_user_id).
-- As instituições existentes são vinculadas pelo e-mail no primeiro login.

-- DropForeignKey
ALTER TABLE "verification_codes" DROP CONSTRAINT "verification_codes_school_id_fkey";

-- AlterTable
ALTER TABLE "schools" DROP COLUMN "email_verified_at",
DROP COLUMN "password_hash",
DROP COLUMN "session_version",
ADD COLUMN     "auth_user_id" UUID;

-- DropTable
DROP TABLE "verification_codes";

-- DropEnum
DROP TYPE "CodePurpose";

-- CreateIndex
CREATE UNIQUE INDEX "schools_auth_user_id_key" ON "schools"("auth_user_id");

