import { forwardRef, Module } from '@nestjs/common';
import { OrganisationsController } from './organisations.controller';
import { OrganisationsService } from './organisations.service';
import { AuditModule } from '../audit/audit.module';
import { OrganisationSettingsController } from './organisation-settings.controller';
import { OrganisationSettingsService } from './organisation-settings.service';
import { AuthModule } from '../auth/auth.module';
import { BootstrapModule } from '../bootstrap/bootstrap.module';

@Module({
  imports: [AuditModule, forwardRef(() => AuthModule), BootstrapModule],
  controllers: [OrganisationsController, OrganisationSettingsController],
  providers: [OrganisationsService, OrganisationSettingsService],
  exports: [OrganisationsService],
})
export class OrganisationsModule {}
