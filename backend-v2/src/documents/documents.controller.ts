import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  StreamableFile,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AuditLog } from '../audit/audit-log.decorator';
import { AuditLogInterceptor } from '../audit/audit-log.interceptor';
import { Permission } from '../auth/permissions';
import * as fs from 'fs/promises';
import { CreateDocumentRequestDto } from './dto/create-document-request.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
@Controller('employees/:employeeId/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  private withDownloadUrl(employeeId: string, document: any) {
    return {
      ...document,
      downloadUrl: `/api/employees/${employeeId}/documents/${document.id}/download`,
    };
  }

  @RequirePermissions(Permission.EMPLOYEE_VIEW)
  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
  ) {
    const documents = await this.documentsService.findAll(
      user.organisationId,
      employeeId,
      user.role,
      user.id,
    );
    return documents.map((document) =>
      this.withDownloadUrl(employeeId, document),
    );
  }

  @RequirePermissions(Permission.EMPLOYEE_VIEW)
  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
    @Param('id') id: string,
  ) {
    const document = await this.documentsService.findOne(
      user.organisationId,
      employeeId,
      id,
      user.role,
      user.id,
    );
    return this.withDownloadUrl(employeeId, document);
  }

  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @AuditLog({
    action: 'DOCUMENT_UPLOAD',
    entityType: 'document',
    captureBody: true,
  })
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType:
              /^(application\/pdf|image\/(jpeg|png)|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/,
          }),
        ],
      }),
    )
    file: any, // Using any to avoid Multer type issues
    @Body() body: CreateDocumentRequestDto,
  ) {
    // Generate storage path
    const storagePath = this.documentsService.generateStoragePath(
      file.originalname,
    );

    // Save file
    await this.documentsService.saveFile(file.buffer, storagePath);

    // Create document record
    const document = await this.documentsService.create(
      user.organisationId,
      employeeId,
      user.id,
      {
        type: body.type,
        title: body.title || file.originalname,
        description: body.description,
        issuedAt: body.issuedAt,
        expiresAt: body.expiresAt,
        status: body.status,
        filename: file.originalname,
        storagePath,
        mimeType: file.mimetype,
        fileSize: file.size,
      } satisfies CreateDocumentDto,
    );

    return this.withDownloadUrl(employeeId, document);
  }

  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  @Patch(':id')
  @AuditLog({
    action: 'DOCUMENT_UPDATE',
    entityType: 'document',
    entityIdParam: 'id',
    fetchBefore: true,
    captureBody: true,
  })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    const document = await this.documentsService.update(
      user.organisationId,
      employeeId,
      id,
      dto,
    );
    return this.withDownloadUrl(employeeId, document);
  }

  @RequirePermissions(Permission.EMPLOYEE_VIEW)
  @Get(':id/download')
  async download(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const document = await this.documentsService.findOne(
      user.organisationId,
      employeeId,
      id,
      user.role,
      user.id,
    );

    const filePath = await this.documentsService.getFilePath(document);
    const fileBuffer = await fs.readFile(filePath);

    res.set({
      'Content-Type': document.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(document.filename)}"`,
      'Content-Length': document.fileSize,
    });

    return new StreamableFile(fileBuffer);
  }

  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  @Delete(':id')
  @AuditLog({
    action: 'DOCUMENT_DELETE',
    entityType: 'document',
    entityIdParam: 'id',
    fetchBefore: true,
  })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
    @Param('id') id: string,
  ) {
    return this.documentsService.remove(user.organisationId, employeeId, id);
  }
}
