-- CreateTable
CREATE TABLE "file" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "upload" UUID NOT NULL,
    "salt" TEXT NOT NULL,
    "header" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "meta_header" TEXT NOT NULL,
    "meta_data" TEXT NOT NULL,
    "downloads" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hash" TEXT NOT NULL,
    "expire_downloads" INTEGER NOT NULL DEFAULT 1,
    "expire_at" TIMESTAMP(6) NOT NULL,
    "deleted_at" TIMESTAMP(6),
    "report" TEXT,

    CONSTRAINT "upload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "upload_expire_at_index" ON "upload"("expire_at");

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_upload_fkey" FOREIGN KEY ("upload") REFERENCES "upload"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Manually adding CHECKS
-- See: https://www.prisma.io/docs/orm/prisma-migrate/workflows/unsupported-database-features#customize-a-migration-to-include-an-unsupported-feature
ALTER TABLE "upload" ADD CONSTRAINT upload_hash_check CHECK (length(hash) < 1024);
ALTER TABLE "upload" ADD CONSTRAINT report_check CHECK (length(report) < 1024);
ALTER TABLE "file" ADD CONSTRAINT file_salt_check CHECK (length(salt) < 1024);
ALTER TABLE "file" ADD CONSTRAINT file_header_check CHECK (length(header) < 1024);
ALTER TABLE "file" ADD CONSTRAINT meta_header_check CHECK (length(meta_header) < 1024);
ALTER TABLE "file" ADD CONSTRAINT meta_data_check CHECK (length(meta_data) < 1024);