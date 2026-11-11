-- Calendário escolar: feriados nacionais (compartilhados entre escolas), feriados desmarcados por escola,
-- dias sem aula e bimestres do ano letivo.

-- CreateTable
CREATE TABLE "national_holidays" (
    "date" DATE NOT NULL,
    "name" VARCHAR(80) NOT NULL,

    CONSTRAINT "national_holidays_pkey" PRIMARY KEY ("date")
);

-- CreateTable
CREATE TABLE "holiday_overrides" (
    "school_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "holiday_overrides_pkey" PRIMARY KEY ("school_id","date")
);

-- CreateTable
CREATE TABLE "no_class_days" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "no_class_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_terms" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "school_year" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,

    CONSTRAINT "school_terms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "no_class_days_school_id_start_date_idx" ON "no_class_days"("school_id", "start_date");

-- CreateIndex
CREATE UNIQUE INDEX "school_terms_school_id_school_year_number_key" ON "school_terms"("school_id", "school_year", "number");

-- AddForeignKey
ALTER TABLE "holiday_overrides" ADD CONSTRAINT "holiday_overrides_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "no_class_days" ADD CONSTRAINT "no_class_days_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_terms" ADD CONSTRAINT "school_terms_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS como nas demais tabelas (a API acessa pelo Prisma, dono das tabelas).
ALTER TABLE "national_holidays" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "holiday_overrides" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "no_class_days" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "school_terms" ENABLE ROW LEVEL SECURITY;
