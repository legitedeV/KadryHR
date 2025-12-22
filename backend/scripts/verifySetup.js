/**
 * Skrypt weryfikacyjny - sprawdza czy wszystko jest poprawnie skonfigurowane
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');
const ScheduleEntry = require('../models/ScheduleEntry');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kadryhr';

async function verify() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Połączono z MongoDB\n');

    // 1. Sprawdź użytkowników
    const users = await User.find({});
    console.log('👥 UŻYTKOWNICY:', users.length);
    users.forEach(u => {
      console.log(`   - ${u.email} (${u.role})`);
    });
    console.log('');

    // 2. Sprawdź pracowników
    const employees = await Employee.find({}).populate('user');
    console.log('👷 PRACOWNICY:', employees.length);
    employees.forEach(emp => {
      const linked = emp.user ? `✅ powiązany z ${emp.user.email}` : '❌ BRAK powiązania';
      console.log(`   - ${emp.firstName} ${emp.lastName} (${emp.position}) - ${linked}`);
    });
    console.log('');

    // 3. Sprawdź pracowników bez powiązania
    const unlinked = employees.filter(e => !e.user);
    if (unlinked.length > 0) {
      console.log('⚠️  PRACOWNICY BEZ POWIĄZANIA Z USEREM:', unlinked.length);
      unlinked.forEach(emp => {
        console.log(`   - ${emp.firstName} ${emp.lastName} (ID: ${emp._id})`);
      });
      console.log('');
      console.log('💡 Aby powiązać, uruchom:');
      console.log('   node scripts/linkUserToEmployee.js <user_email> <employee_id>');
      console.log('');
    }

    // 4. Sprawdź grafik
    const scheduleCount = await ScheduleEntry.countDocuments();
    console.log('📅 WPISY W GRAFIKU:', scheduleCount);
    
    if (scheduleCount > 0) {
      const upcoming = await ScheduleEntry.find({
        date: { $gte: new Date() }
      })
      .populate('employee')
      .sort({ date: 1 })
      .limit(5);
      
      console.log('   Najbliższe zmiany:');
      upcoming.forEach(s => {
        const empName = s.employee ? `${s.employee.firstName} ${s.employee.lastName}` : 'Brak';
        console.log(`   - ${s.date.toISOString().split('T')[0]} ${s.startTime}-${s.endTime} (${empName})`);
      });
    }
    console.log('');

    // 5. Podsumowanie
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 PODSUMOWANIE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Użytkownicy: ${users.length}`);
    console.log(`   Pracownicy: ${employees.length}`);
    console.log(`   Powiązani: ${employees.filter(e => e.user).length}`);
    console.log(`   Niepowiązani: ${unlinked.length}`);
    console.log(`   Wpisy w grafiku: ${scheduleCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (unlinked.length > 0) {
      console.log('\n⚠️  UWAGA: Niektórzy pracownicy nie mają powiązania z userem!');
      console.log('   Dashboard użytkownika nie będzie działał poprawnie.');
      console.log('   Uruchom: node scripts/linkUserToEmployee.js');
    } else {
      console.log('\n✅ Wszystko wygląda dobrze!');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Błąd:', err.message);
    process.exit(1);
  }
}

verify();
