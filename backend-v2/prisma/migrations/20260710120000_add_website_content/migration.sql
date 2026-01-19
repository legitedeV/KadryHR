-- CreateTable
CREATE TABLE "WebsitePage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoImageUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsitePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteSection" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteBlock" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "mediaUrl" TEXT,
    "extra" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteSettings" (
    "id" TEXT NOT NULL,
    "contactEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "socialLinks" JSONB,
    "footerLinks" JSONB,
    "cookieBannerText" TEXT,
    "cookiePolicyUrl" TEXT,
    "privacyPolicyUrl" TEXT,
    "termsOfServiceUrl" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebsitePage_slug_key" ON "WebsitePage"("slug");

-- CreateIndex
CREATE INDEX "WebsiteSection_pageId_idx" ON "WebsiteSection"("pageId");

-- CreateIndex
CREATE INDEX "WebsiteSection_pageId_order_idx" ON "WebsiteSection"("pageId", "order");

-- CreateIndex
CREATE INDEX "WebsiteBlock_sectionId_idx" ON "WebsiteBlock"("sectionId");

-- CreateIndex
CREATE INDEX "WebsiteBlock_sectionId_order_idx" ON "WebsiteBlock"("sectionId", "order");

-- AddForeignKey
ALTER TABLE "WebsiteSection" ADD CONSTRAINT "WebsiteSection_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "WebsitePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteBlock" ADD CONSTRAINT "WebsiteBlock_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "WebsiteSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
