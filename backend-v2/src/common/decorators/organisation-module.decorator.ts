import { SetMetadata } from '@nestjs/common';
import type { OrganisationModule } from '../constants/organisation-modules.constant';

export const ORGANISATION_MODULE_KEY = 'organisation_module_key';

export const RequireOrganisationModule = (moduleName: OrganisationModule) =>
  SetMetadata(ORGANISATION_MODULE_KEY, moduleName);
