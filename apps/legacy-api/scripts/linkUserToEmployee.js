/**
 * Skrypt do powiązania użytkownika z profilem pracownika
 * Użycie: node scripts/linkUserToEmployee.js <user_email> <employee_id>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kadryhr';

async function linkUserToEmployee(userEmail, employeeId) {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Połączono z MongoDB');

    const user = await User.findOne({ email: userEmail.toLowerCase().trim() });
    if (!user) {
      console.error('❌ Nie znaleziono użytkownika:', userEmail);
      process.exit(1);
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      console.error('❌ Nie znaleziono pracownika o ID:', employeeId);
      process.exit(1);
    }

    employee.user = user._id;
    await employee.save();

    console.log('✅ Powiązano:');
    console.log('   User:', user.email, '(', user.name, ')');
    console.log('   Employee:', employee.firstName, employee.lastName, '(', employee.position, ')');
    console.log('   Employee ID:', employee._id.toString());

    process.exit(0);
  } catch (err) {
    console.error('❌ Błąd:', err.message);
    process.exit(1);
  }
}

// Automatyczne powiązanie dla test.pracownik@kadryhr.pl
async function autoLinkTestUser() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Połączono z MongoDB');

    const user = await User.findOne({ email: 'test.pracownik@kadryhr.pl' });
    if (!user) {
      console.log('ℹ️  Użytkownik test.pracownik@kadryhr.pl nie istnieje');
      process.exit(0);
    }

    // Znajdź pracownika o imieniu "Test"
    let employee = await Employee.findOne({ firstName: 'Test', lastName: 'Pracownik' });
    
    if (!employee) {
      // Utwórz pracownika testowego
      console.log('ℹ️  Tworzę pracownika testowego...');
      employee = await Employee.create({
        firstName: 'Test',
        lastName: 'Pracownik',
        position: 'Pracownik testowy',
        hourlyRate: 25,
        monthlySalary: 4000,
        hoursPerMonth: 160,
        isActive: true,
        user: user._id,
      });
      console.log('✅ Utworzono pracownika testowego');
    } else if (!employee.user) {
      employee.user = user._id;
      await employee.save();
      console.log('✅ Powiązano istniejącego pracownika z userem');
    } else {
      console.log('ℹ️  Pracownik już jest powiązany z userem');
    }

    console.log('✅ Gotowe:');
    console.log('   User:', user.email);
    console.log('   Employee:', employee.firstName, employee.lastName);
    console.log('   Employee ID:', employee._id.toString());

    process.exit(0);
  } catch (err) {
    console.error('❌ Błąd:', err.message);
    process.exit(1);
  }
}

// Jeśli podano argumenty, użyj ich
if (process.argv.length >= 4) {
  const userEmail = process.argv[2];
  const employeeId = process.argv[3];
  linkUserToEmployee(userEmail, employeeId);
} else {
  // W przeciwnym razie auto-link dla test user
  console.log('ℹ️  Automatyczne powiązanie dla test.pracownik@kadryhr.pl');
  autoLinkTestUser();
}
