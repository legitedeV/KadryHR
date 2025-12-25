/**
 * Seed Demo Data Script
 * 
 * This script creates demo data for the KadryHR demo account.
 * Run with: node scripts/seedDemoData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kadryhr';
const DEMO_EMAIL = 'demo@kadryhr.pl';

async function seedDemoData() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const employeesCollection = db.collection('employees');
    const schedulesCollection = db.collection('schedules');
    const leavesCollection = db.collection('leaves');

    // 1. Find or create demo user
    console.log('\n📝 Creating demo user...');
    let demoUser = await usersCollection.findOne({ email: DEMO_EMAIL });
    
    if (!demoUser) {
      const hashedPassword = await bcrypt.hash('Demo1234!', 10);
      const result = await usersCollection.insertOne({
        name: 'Demo Administrator',
        email: DEMO_EMAIL,
        passwordHash: hashedPassword,
        role: 'admin',
        isActive: true,
        isDemo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      demoUser = await usersCollection.findOne({ _id: result.insertedId });
      console.log('✅ Demo user created');
    } else {
      console.log('✅ Demo user already exists');
    }

    const demoUserId = demoUser._id;

    // 2. Create demo employees
    console.log('\n👥 Creating demo employees...');
    
    // Clear existing demo employees
    await employeesCollection.deleteMany({ companyId: demoUserId });
    
    const demoEmployees = [
      {
        firstName: 'Anna',
        lastName: 'Kowalska',
        position: 'Manager',
        hourlyRate: 50,
        monthlySalary: 8000,
        hoursPerMonth: 160,
        companyId: demoUserId,
        isActive: true,
        skills: ['zarządzanie', 'obsługa klienta'],
        maxHoursPerDay: 8,
        maxHoursPerWeek: 40,
        canWorkNights: false,
        canWorkWeekends: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        firstName: 'Jan',
        lastName: 'Nowak',
        position: 'Kasjer',
        hourlyRate: 30,
        monthlySalary: 4800,
        hoursPerMonth: 160,
        companyId: demoUserId,
        isActive: true,
        skills: ['kasa', 'obsługa klienta'],
        maxHoursPerDay: 8,
        maxHoursPerWeek: 40,
        canWorkNights: true,
        canWorkWeekends: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        firstName: 'Maria',
        lastName: 'Wiśniewska',
        position: 'Sprzedawca',
        hourlyRate: 28,
        monthlySalary: 4480,
        hoursPerMonth: 160,
        companyId: demoUserId,
        isActive: true,
        skills: ['sprzedaż', 'obsługa klienta'],
        maxHoursPerDay: 8,
        maxHoursPerWeek: 40,
        canWorkNights: false,
        canWorkWeekends: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        firstName: 'Piotr',
        lastName: 'Zieliński',
        position: 'Magazynier',
        hourlyRate: 32,
        monthlySalary: 5120,
        hoursPerMonth: 160,
        companyId: demoUserId,
        isActive: true,
        skills: ['magazyn', 'logistyka'],
        maxHoursPerDay: 8,
        maxHoursPerWeek: 40,
        canWorkNights: true,
        canWorkWeekends: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        firstName: 'Katarzyna',
        lastName: 'Lewandowska',
        position: 'Kasjer',
        hourlyRate: 29,
        monthlySalary: 4640,
        hoursPerMonth: 160,
        companyId: demoUserId,
        isActive: true,
        skills: ['kasa', 'obsługa klienta'],
        maxHoursPerDay: 8,
        maxHoursPerWeek: 40,
        canWorkNights: false,
        canWorkWeekends: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const employeeResult = await employeesCollection.insertMany(demoEmployees);
    const employeeIds = Object.values(employeeResult.insertedIds);
    console.log(`✅ Created ${employeeIds.length} demo employees`);

    // 3. Create demo schedule entries (current month)
    console.log('\n📅 Creating demo schedule...');
    
    // Clear existing demo schedules
    await schedulesCollection.deleteMany({ 
      employee: { $in: employeeIds }
    });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const demoSchedules = [];

    // Create 2 weeks of schedule
    for (let day = 0; day < 14; day++) {
      const date = new Date(currentYear, currentMonth, now.getDate() + day);
      
      // Skip Sundays
      if (date.getDay() === 0) continue;

      // Assign 2-3 employees per day
      const employeesPerDay = 2 + Math.floor(Math.random() * 2);
      const selectedEmployees = employeeIds
        .sort(() => Math.random() - 0.5)
        .slice(0, employeesPerDay);

      for (const empId of selectedEmployees) {
        const shiftType = Math.random() > 0.5 ? 'morning' : 'afternoon';
        const startTime = shiftType === 'morning' ? '08:00' : '14:00';
        const endTime = shiftType === 'morning' ? '16:00' : '22:00';

        demoSchedules.push({
          employee: empId,
          date: date,
          startTime,
          endTime,
          type: 'regular',
          status: 'approved',
          notes: 'Automatycznie wygenerowane (demo)',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    if (demoSchedules.length > 0) {
      await schedulesCollection.insertMany(demoSchedules);
      console.log(`✅ Created ${demoSchedules.length} demo schedule entries`);
    }

    // 4. Create demo leave requests
    console.log('\n🏖️ Creating demo leave requests...');
    
    // Clear existing demo leaves
    await leavesCollection.deleteMany({ 
      employee: { $in: employeeIds }
    });

    const demoLeaves = [
      {
        employee: employeeIds[0],
        startDate: new Date(currentYear, currentMonth, now.getDate() + 20),
        endDate: new Date(currentYear, currentMonth, now.getDate() + 24),
        type: 'vacation',
        status: 'approved',
        reason: 'Urlop wypoczynkowy',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        employee: employeeIds[1],
        startDate: new Date(currentYear, currentMonth, now.getDate() + 15),
        endDate: new Date(currentYear, currentMonth, now.getDate() + 16),
        type: 'sick',
        status: 'pending',
        reason: 'Zwolnienie lekarskie',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        employee: employeeIds[2],
        startDate: new Date(currentYear, currentMonth + 1, 5),
        endDate: new Date(currentYear, currentMonth + 1, 10),
        type: 'vacation',
        status: 'pending',
        reason: 'Urlop wypoczynkowy',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await leavesCollection.insertMany(demoLeaves);
    console.log(`✅ Created ${demoLeaves.length} demo leave requests`);

    console.log('\n✅ Demo data seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Demo user: ${DEMO_EMAIL}`);
    console.log(`   - Employees: ${employeeIds.length}`);
    console.log(`   - Schedule entries: ${demoSchedules.length}`);
    console.log(`   - Leave requests: ${demoLeaves.length}`);
    console.log('\n🔐 Demo login credentials:');
    console.log(`   Email: ${DEMO_EMAIL}`);
    console.log(`   Password: Demo1234!`);

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seed function
seedDemoData();
