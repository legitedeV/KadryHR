import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { MembershipRole, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

function loadEnv(): void {
  const envPath = join(__dirname, '../../.env');
  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const [key, ...rest] = trimmed.split('=');
    if (!key) {
      continue;
    }

    const value = rest.join('=');
    if (!process.env[key] && value !== undefined) {
      process.env[key] = value;
    }
  }
}

loadEnv();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Please configure apps/api/.env.');
}

const prisma = new PrismaClient();

const TEST_ADMIN_EMAIL =
  process.env.TEST_ADMIN_EMAIL || 'admin.v2+test@kadryhr.local';
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'AdminTest123!';
const TEST_ADMIN_NAME = process.env.TEST_ADMIN_NAME || 'Test Admin V2';
const TEST_ORG_NAME = process.env.TEST_ADMIN_ORG_NAME || 'KadryHR Test Org V2';

async function createTestAdmin(): Promise<void> {
  const passwordHash = await bcrypt.hash(TEST_ADMIN_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: TEST_ADMIN_EMAIL },
    update: {
      fullName: TEST_ADMIN_NAME,
      passwordHash,
    },
    create: {
      email: TEST_ADMIN_EMAIL,
      fullName: TEST_ADMIN_NAME,
      passwordHash,
    },
  });

  const existingOrganization = await prisma.organization.findFirst({
    where: { name: TEST_ORG_NAME },
  });

  const organization =
    existingOrganization ||
    (await prisma.organization.create({
      data: { name: TEST_ORG_NAME },
    }));

  await prisma.membership.upsert({
    where: { userId_orgId: { userId: user.id, orgId: organization.id } },
    update: { role: MembershipRole.ADMIN },
    create: {
      userId: user.id,
      orgId: organization.id,
      role: MembershipRole.ADMIN,
    },
  });

  console.log('✅ V2 test admin is ready for login');
  console.log('---');
  console.log(`Email: ${TEST_ADMIN_EMAIL}`);
  console.log(`Password: ${TEST_ADMIN_PASSWORD}`);
  console.log(`Organization: ${organization.name}`);
  console.log(`Organization ID: ${organization.id}`);
  console.log('Use POST /v2/auth/login to obtain a JWT for this account.');
}

createTestAdmin()
  .catch((error) => {
    console.error('❌ Failed to create test admin', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
