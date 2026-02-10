import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { EmployeeDocumentStatus, Role } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class DocumentsService {
  private readonly uploadDir: string;

  constructor(private readonly prisma: PrismaService) {
    // Use /uploads directory in project root
    this.uploadDir = path.join(process.cwd(), '..', 'uploads', 'documents');
  }

  async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async create(
    organisationId: string,
    employeeId: string,
    uploadedBy: string,
    dto: CreateDocumentDto,
  ) {
    // Verify employee exists
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organisationId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return this.prisma.employeeDocument.create({
      data: {
        organisationId,
        employeeId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        issuedAt: new Date(dto.issuedAt),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        status: dto.status ?? EmployeeDocumentStatus.DRAFT,
        filename: dto.filename,
        storagePath: dto.storagePath,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
        uploadedBy,
      },
    });
  }

  async findAll(
    organisationId: string,
    employeeId: string,
    userRole: Role,
    userId: string,
  ) {
    // Employees can only see their own documents
    if (userRole === Role.EMPLOYEE) {
      const employee = await this.prisma.employee.findFirst({
        where: { userId, organisationId },
      });

      if (!employee || employee.id !== employeeId) {
        throw new NotFoundException('Access denied');
      }
    }

    return this.prisma.employeeDocument.findMany({
      where: {
        organisationId,
        employeeId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(
    organisationId: string,
    employeeId: string,
    documentId: string,
    userRole: Role,
    userId: string,
  ) {
    // Employees can only access their own documents
    if (userRole === Role.EMPLOYEE) {
      const employee = await this.prisma.employee.findFirst({
        where: { userId, organisationId },
      });

      if (!employee || employee.id !== employeeId) {
        throw new NotFoundException('Access denied');
      }
    }

    const document = await this.prisma.employeeDocument.findFirst({
      where: {
        id: documentId,
        employeeId,
        organisationId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async update(
    organisationId: string,
    employeeId: string,
    documentId: string,
    dto: UpdateDocumentDto,
  ) {
    const document = await this.prisma.employeeDocument.findFirst({
      where: {
        id: documentId,
        employeeId,
        organisationId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const nextStatus = dto.status ?? document.status;

    return this.prisma.employeeDocument.update({
      where: { id: documentId },
      data: {
        type: dto.type ?? document.type,
        title: dto.title ?? document.title,
        description:
          dto.description !== undefined ? dto.description : document.description,
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : document.issuedAt,
        expiresAt:
          dto.expiresAt !== undefined
            ? dto.expiresAt
              ? new Date(dto.expiresAt)
              : null
            : document.expiresAt,
        status: nextStatus,
      },
    });
  }

  async remove(organisationId: string, employeeId: string, documentId: string) {
    const document = await this.prisma.employeeDocument.findFirst({
      where: {
        id: documentId,
        employeeId,
        organisationId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Delete file from storage
    try {
      const fullPath = path.join(this.uploadDir, document.storagePath);
      await fs.unlink(fullPath);
    } catch (err) {
      console.error('Failed to delete file:', err);
      // Continue with DB deletion even if file deletion fails
    }

    await this.prisma.employeeDocument.delete({
      where: { id: documentId },
    });

    return { success: true };
  }

  async getFilePath(document: any): Promise<string> {
    return path.join(this.uploadDir, document.storagePath);
  }

  generateStoragePath(filename: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(filename);
    return `${timestamp}-${random}${ext}`;
  }

  async saveFile(buffer: Buffer, storagePath: string): Promise<void> {
    await this.ensureUploadDir();
    const fullPath = path.join(this.uploadDir, storagePath);
    await fs.writeFile(fullPath, buffer);
  }
}
