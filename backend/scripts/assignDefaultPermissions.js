/**
 * Skrypt do przypisywania domyślnych uprawnień dla użytkowników
 * 
 * Uruchom: node backend/scripts/assignDefaultPermissions.js
 * 
 * Ten skrypt przypisuje podstawowy zestaw uprawnień wszystkim użytkownikom typu 'user'
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const UserPermission = require('../models/UserPermission');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kadryhr';

// Domyślne uprawnienia dla zwykłych użytkowników
const DEFAULT_USER_PERMISSIONS = [
  'dashboard.view',
  'self_service.view',
  'time_tracking.view',
  'chat.view',
  'notifications.view',
  'leaves.view',
  'leaves.create',
  'schedule.view',
  'settings.view',
];

async function assignDefaultPermissions() {
  try {
    console.log('🔌 Łączenie z bazą danych...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Połączono z MongoDB');

    // Znajdź wszystkich użytkowników typu 'user' bez uprawnień
    const users = await User.find({ role: 'user', isActive: true });
    console.log(`📋 Znaleziono ${users.length} użytkowników typu 'user'`);

    let assigned = 0;
    let skipped = 0;

    for (const user of users) {
      // Sprawdź czy użytkownik już ma uprawnienia
      const existing = await UserPermission.findOne({ user: user._id, isActive: true });
      
      if (existing) {
        console.log(`⏭️  Pomijam ${user.name} - już ma uprawnienia`);
        skipped++;
        continue;
      }

      // Utwórz domyślne uprawnienia
      await UserPermission.create({
        user: user._id,
        permissions: DEFAULT_USER_PERMISSIONS,
        restrictions: {
          ownDataOnly: false,
          teamDataOnly: false,
        },
        grantedBy: user._id, // Self-assigned (można zmienić na admin ID)
        isActive: true,
      });

      console.log(`✅ Przypisano uprawnienia dla ${user.name}`);
      assigned++;
    }

    console.log('\n📊 Podsumowanie:');
    console.log(`   Przypisano: ${assigned}`);
    console.log(`   Pominięto: ${skipped}`);
    console.log('✨ Gotowe!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Błąd:', error.message);
    process.exit(1);
  }
}

assignDefaultPermissions();
