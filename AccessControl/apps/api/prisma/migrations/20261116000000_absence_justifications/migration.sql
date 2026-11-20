-- Faltas justificadas (atestados).
-- CreateTable
CREATE TABLE "absence_justifications" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "reason" VARCHAR(200) NOT NULL,
    "user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "absence_justifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "absence_justifications_student_id_start_date_idx" ON "absence_justifications"("student_id", "start_date");

-- AddForeignKey
ALTER TABLE "absence_justifications" ADD CONSTRAINT "absence_justifications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absence_justifications" ADD CONSTRAINT "absence_justifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- RLS: a tabela só é acessada pela API (conexão de serviço).
ALTER TABLE "absence_justifications" ENABLE ROW LEVEL SECURITY;
