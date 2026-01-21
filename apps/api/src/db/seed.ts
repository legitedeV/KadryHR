import { hash } from '@node-rs/argon2';
import { db } from './index.js';
import * as schema from './schema.js';
import { nanoid } from 'nanoid';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../../.env') });

async function seed() {
  console.log('Seeding database...');

  try {
    // Create tenant
    const [tenant] = await db
      .insert(schema.tenants)
      .values({
        name: 'Example Firma',
        slug: 'example-firma',
        settings: {},
      })
      .returning();

    console.log('Created tenant:', tenant.name);

    // Create owner user
    const passwordHash = await hash('password123', {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    const [owner] = await db
      .insert(schema.users)
      .values({
        tenantId: tenant.id,
        email: 'admin@example.com',
        passwordHash,
        name: 'Admin User',
        role: 'owner',
      })
      .returning();

    console.log('Created owner user:', owner.email);

    // Create positions
    const positionsData = [
      { name: 'Kelner', color: '#3b82f6' },
      { name: 'Kucharz', color: '#ef4444' },
      { name: 'Barman', color: '#10b981' },
    ];

    const createdPositions = await db
      .insert(schema.positions)
      .values(
        positionsData.map((p) => ({
          tenantId: tenant.id,
          ...p,
        }))
      )
      .returning();

    console.log(`Created ${createdPositions.length} positions`);

    // Create tags
    const tagsData = [
      { name: 'Full-time', color: '#6366f1' },
      { name: 'Part-time', color: '#f59e0b' },
      { name: 'Student', color: '#8b5cf6' },
    ];

    const createdTags = await db
      .insert(schema.tags)
      .values(
        tagsData.map((t) => ({
          tenantId: tenant.id,
          ...t,
        }))
      )
      .returning();

    console.log(`Created ${createdTags.length} tags`);

    // Create employees
    const employeesData = [
      {
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'jan.kowalski@example.com',
        phone: '+48 123 456 789',
        positionId: createdPositions[0].id,
        tags: [createdTags[0].id],
        status: 'active' as const,
        hireDate: '2023-01-15',
      },
      {
        firstName: 'Anna',
        lastName: 'Nowak',
        email: 'anna.nowak@example.com',
        phone: '+48 234 567 890',
        positionId: createdPositions[1].id,
        tags: [createdTags[0].id],
        status: 'active' as const,
        hireDate: '2023-02-20',
      },
      {
        firstName: 'Piotr',
        lastName: 'Wiśniewski',
        email: 'piotr.wisniewski@example.com',
        phone: '+48 345 678 901',
        positionId: createdPositions[2].id,
        tags: [createdTags[1].id],
        status: 'active' as const,
        hireDate: '2023-03-10',
      },
      {
        firstName: 'Maria',
        lastName: 'Wójcik',
        email: 'maria.wojcik@example.com',
        phone: '+48 456 789 012',
        positionId: createdPositions[0].id,
        tags: [createdTags[2].id],
        status: 'active' as const,
        hireDate: '2023-04-05',
      },
      {
        firstName: 'Tomasz',
        lastName: 'Kamiński',
        email: 'tomasz.kaminski@example.com',
        phone: '+48 567 890 123',
        positionId: createdPositions[1].id,
        tags: [createdTags[0].id],
        status: 'active' as const,
        hireDate: '2023-05-12',
      },
      {
        firstName: 'Katarzyna',
        lastName: 'Lewandowska',
        email: 'katarzyna.lewandowska@example.com',
        phone: '+48 678 901 234',
        positionId: createdPositions[2].id,
        tags: [createdTags[1].id],
        status: 'active' as const,
        hireDate: '2023-06-18',
      },
      {
        firstName: 'Michał',
        lastName: 'Zieliński',
        email: 'michal.zielinski@example.com',
        phone: '+48 789 012 345',
        positionId: createdPositions[0].id,
        tags: [createdTags[2].id],
        status: 'active' as const,
        hireDate: '2023-07-22',
      },
      {
        firstName: 'Magdalena',
        lastName: 'Szymańska',
        email: 'magdalena.szymanska@example.com',
        phone: '+48 890 123 456',
        positionId: createdPositions[1].id,
        tags: [createdTags[0].id, createdTags[1].id],
        status: 'active' as const,
        hireDate: '2023-08-14',
      },
      {
        firstName: 'Jakub',
        lastName: 'Woźniak',
        email: 'jakub.wozniak@example.com',
        phone: '+48 901 234 567',
        positionId: createdPositions[2].id,
        tags: [createdTags[2].id],
        status: 'active' as const,
        hireDate: '2023-09-08',
      },
      {
        firstName: 'Agnieszka',
        lastName: 'Dąbrowska',
        email: 'agnieszka.dabrowska@example.com',
        phone: '+48 012 345 678',
        positionId: createdPositions[0].id,
        tags: [createdTags[1].id],
        status: 'active' as const,
        hireDate: '2023-10-03',
      },
    ];

    const createdEmployees = await db
      .insert(schema.employees)
      .values(
        employeesData.map((e) => ({
          tenantId: tenant.id,
          ...e,
        }))
      )
      .returning();

    console.log(`Created ${createdEmployees.length} employees`);

    // Create default schedule
    const [schedule] = await db
      .insert(schema.schedules)
      .values({
        tenantId: tenant.id,
        name: 'Default Schedule',
        isDefault: true,
        publishedUntil: null,
      })
      .returning();

    console.log('Created schedule:', schedule.name);

    // Create shifts for current month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const shiftsData = [];

    for (let day = 1; day <= 20; day++) {
      const date = new Date(year, month, day);
      if (date.getDay() === 0) continue; // Skip Sundays

      // Morning shifts
      for (let i = 0; i < 3; i++) {
        const employee = createdEmployees[i % createdEmployees.length];
        shiftsData.push({
          tenantId: tenant.id,
          scheduleId: schedule.id,
          employeeId: employee.id,
          startTime: new Date(year, month, day, 8, 0),
          endTime: new Date(year, month, day, 16, 0),
          positionId: employee.positionId!,
          notes: null,
        });
      }

      // Evening shifts
      for (let i = 0; i < 2; i++) {
        const employee = createdEmployees[(i + 3) % createdEmployees.length];
        shiftsData.push({
          tenantId: tenant.id,
          scheduleId: schedule.id,
          employeeId: employee.id,
          startTime: new Date(year, month, day, 16, 0),
          endTime: new Date(year, month, day, 22, 0),
          positionId: employee.positionId!,
          notes: null,
        });
      }
    }

    const createdShifts = await db.insert(schema.shifts).values(shiftsData).returning();
    console.log(`Created ${createdShifts.length} shifts`);

    // Create availability entries
    const availabilityData = [
      {
        employeeId: createdEmployees[0].id,
        date: new Date(year, month, 25).toISOString().split('T')[0],
        type: 'unavailable' as const,
        notes: 'Medical appointment',
        status: 'pending' as const,
      },
      {
        employeeId: createdEmployees[1].id,
        date: new Date(year, month, 26).toISOString().split('T')[0],
        type: 'available' as const,
        notes: 'Can work extra hours',
        status: 'approved' as const,
      },
      {
        employeeId: createdEmployees[2].id,
        date: new Date(year, month, 27).toISOString().split('T')[0],
        type: 'partial' as const,
        notes: 'Available only in the morning',
        status: 'pending' as const,
      },
      {
        employeeId: createdEmployees[3].id,
        date: new Date(year, month, 28).toISOString().split('T')[0],
        type: 'unavailable' as const,
        notes: 'Family event',
        status: 'approved' as const,
      },
      {
        employeeId: createdEmployees[4].id,
        date: new Date(year, month, 29).toISOString().split('T')[0],
        type: 'available' as const,
        notes: 'Flexible schedule',
        status: 'rejected' as const,
      },
    ];

    const createdAvailability = await db
      .insert(schema.availability)
      .values(
        availabilityData.map((a) => ({
          tenantId: tenant.id,
          ...a,
        }))
      )
      .returning();

    console.log(`Created ${createdAvailability.length} availability entries`);

    // Create holidays
    const holidaysData = [
      { name: 'New Year', date: `${year}-01-01`, type: 'national' as const },
      { name: 'Easter Monday', date: `${year}-04-01`, type: 'national' as const },
      { name: 'Labour Day', date: `${year}-05-01`, type: 'national' as const },
      { name: 'Constitution Day', date: `${year}-05-03`, type: 'national' as const },
      { name: 'Independence Day', date: `${year}-11-11`, type: 'national' as const },
    ];

    const createdHolidays = await db
      .insert(schema.holidays)
      .values(
        holidaysData.map((h) => ({
          tenantId: tenant.id,
          ...h,
        }))
      )
      .returning();

    console.log(`Created ${createdHolidays.length} holidays`);

    // Create Google integration stub
    const [integration] = await db
      .insert(schema.integrations)
      .values({
        tenantId: tenant.id,
        provider: 'google',
        config: {
          clientId: '',
          clientSecret: '',
        },
        enabled: false,
      })
      .returning();

    console.log('Created integration:', integration.provider);

    // Create mock file entries
    const filesData = [
      {
        key: `avatars/${nanoid()}.jpg`,
        bucket: 'kadryhr-files',
        mimeType: 'image/jpeg',
        size: 102400,
        uploadedBy: owner.id,
      },
      {
        key: `avatars/${nanoid()}.jpg`,
        bucket: 'kadryhr-files',
        mimeType: 'image/jpeg',
        size: 98304,
        uploadedBy: owner.id,
      },
    ];

    const createdFiles = await db
      .insert(schema.files)
      .values(
        filesData.map((f) => ({
          tenantId: tenant.id,
          ...f,
        }))
      )
      .returning();

    console.log(`Created ${createdFiles.length} file entries`);

    console.log('\nSeed completed successfully!');
    console.log('\nLogin credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
