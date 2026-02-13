import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganisationBootstrapService } from './organisation-bootstrap.service';

@Module({
  imports: [PrismaModule],
  providers: [OrganisationBootstrapService],
  exports: [OrganisationBootstrapService],
})
export class BootstrapModule {}
