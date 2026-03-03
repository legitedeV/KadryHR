import { NotFoundException } from '@nestjs/common';
import { WebsiteService } from './website.service';

describe('WebsiteService', () => {
  let service: WebsiteService;
  const prisma = {
    websitePage: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  } as any;
  const auditService = {
    record: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new WebsiteService(prisma, auditService);
  });

  describe('listPublishedPages', () => {
    it('returns only published pages', async () => {
      const published = [
        {
          id: 'p1',
          slug: 'home',
          title: 'Home',
          seoTitle: 'Home SEO',
          seoDescription: null,
          seoImageUrl: null,
          version: 1,
          updatedAt: new Date(),
        },
      ];
      prisma.websitePage.findMany.mockResolvedValue(published);

      const result = await service.listPublishedPages();

      expect(result).toEqual(published);
      expect(prisma.websitePage.findMany).toHaveBeenCalledWith({
        where: { isPublished: true },
        orderBy: { slug: 'asc' },
        select: {
          id: true,
          slug: true,
          title: true,
          seoTitle: true,
          seoDescription: true,
          seoImageUrl: true,
          version: true,
          updatedAt: true,
        },
      });
    });

    it('returns empty array when no pages are published', async () => {
      prisma.websitePage.findMany.mockResolvedValue([]);

      const result = await service.listPublishedPages();

      expect(result).toEqual([]);
    });
  });

  describe('listPages', () => {
    it('includes title in the select clause', async () => {
      prisma.websitePage.findMany.mockResolvedValue([]);

      await service.listPages();

      expect(prisma.websitePage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({ title: true }),
        }),
      );
    });
  });

  describe('createPage', () => {
    it('persists title field', async () => {
      const created = { id: 'p1', slug: 'test', title: 'Test Page' };
      prisma.websitePage.create.mockResolvedValue(created);
      auditService.record.mockResolvedValue(undefined);

      const result = await service.createPage('org-1', 'user-1', {
        slug: 'test',
        title: 'Test Page',
      });

      expect(result).toEqual(created);
      expect(prisma.websitePage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ title: 'Test Page' }),
      });
    });

    it('defaults title to null when not provided', async () => {
      const created = { id: 'p1', slug: 'test', title: null };
      prisma.websitePage.create.mockResolvedValue(created);
      auditService.record.mockResolvedValue(undefined);

      await service.createPage('org-1', 'user-1', { slug: 'test' });

      expect(prisma.websitePage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ title: null }),
      });
    });
  });

  describe('updatePage', () => {
    it('updates title field', async () => {
      const existing = { id: 'p1', slug: 'test', title: 'Old' };
      const updated = { id: 'p1', slug: 'test', title: 'New Title' };
      prisma.websitePage.findUnique.mockResolvedValue(existing);
      prisma.websitePage.update.mockResolvedValue(updated);
      auditService.record.mockResolvedValue(undefined);

      const result = await service.updatePage('org-1', 'user-1', 'test', {
        title: 'New Title',
      });

      expect(result).toEqual(updated);
      expect(prisma.websitePage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ title: 'New Title' }),
        }),
      );
    });

    it('throws NotFoundException for non-existent page', async () => {
      prisma.websitePage.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePage('org-1', 'user-1', 'missing', {
          title: 'X',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
