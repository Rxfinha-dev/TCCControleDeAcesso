-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CodePurpose" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "SchoolYear" AS ENUM ('FIRST', 'SECOND', 'THIRD');

-- CreateEnum
CREATE TYPE "AccessMethod" AS ENUM ('FINGERPRINT', 'MANUAL');

-- CreateTable
CREATE TABLE "schools" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "email_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_codes" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "purpose" "CodePurpose" NOT NULL,
    "code_hash" VARCHAR(255) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "school_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "rm" VARCHAR(8) NOT NULL,
    "age" INTEGER NOT NULL,
    "year" "SchoolYear" NOT NULL,
    "course_id" INTEGER NOT NULL,
    "school_id" INTEGER NOT NULL,
    "photo_key" VARCHAR(255),
    "fingerprint_id" INTEGER,
    "fingerprint_enrolled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_photos" (
    "student_id" INTEGER NOT NULL,
    "mime_type" VARCHAR(50) NOT NULL,
    "data" BYTEA NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_photos_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "access_logs" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "student_id" INTEGER,
    "student_name" VARCHAR(100) NOT NULL,
    "method" "AccessMethod" NOT NULL DEFAULT 'FINGERPRINT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_email_key" ON "schools"("email");

-- CreateIndex
CREATE INDEX "verification_codes_school_id_purpose_idx" ON "verification_codes"("school_id", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "courses_school_id_name_key" ON "courses"("school_id", "name");

-- CreateIndex
CREATE INDEX "students_school_id_name_idx" ON "students"("school_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "students_school_id_rm_key" ON "students"("school_id", "rm");

-- CreateIndex
CREATE UNIQUE INDEX "students_school_id_fingerprint_id_key" ON "students"("school_id", "fingerprint_id");

-- CreateIndex
CREATE INDEX "access_logs_school_id_created_at_idx" ON "access_logs"("school_id", "created_at");

-- AddForeignKey
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_photos" ADD CONSTRAINT "student_photos_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

