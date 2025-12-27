// scripts/resetAdminPassword.js
// Ustawia / nadpisuje hasło admina na Admin123!

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kadryhr';

const ADMIN_EMAIL = 'admin@kadryhr.local';
const NEW_PASSWORD = 'Admin123!';

(async () => {
  try {
    console.log('🔌 Łączenie z MongoDB:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Połączono z MongoDB');

    // spróbujmy podejrzeć aktualny dokument
    let existing = await User.findOne({ email: ADMIN_EMAIL }).lean();
    console.log('📄 Aktualny dokument admina (PRZED):', existing);

    const hash = await bcrypt.hash(NEW_PASSWORD, 10);

    let user = await User.findOne({ email: ADMIN_EMAIL }).select(
      '+password +passwordHash +role +name'
    );

    if (!user) {
      console.log('👤 Nie znaleziono admina – tworzymy nowego');

      user = new User({
        name: 'Super Admin',
        email: ADMIN_EMAIL,
        password: hash,
        passwordHash: hash, // jeśli schema nie ma, Mongoose po prostu to zignoruje
        role: 'admin',
        isActive: true,
      });

      await user.save();
    } else {
      console.log('✏️ Aktualizuję istniejącego admina...');

      // ustawiamy na pewno pole password,
      // passwordHash traktujemy jako bonus jeśli istnieje w schemacie
      user.password = hash;
      try {
        user.passwordHash = hash;
      } catch (_e) {
        // jeśli schema jest „sztywna” i nie ma passwordHash – olewamy
      }
      await user.save();
    }

    const after = await User.findOne({ email: ADMIN_EMAIL })
      .select('+password +passwordHash +role +name')
      .lean();

    console.log('📄 Dokument admina (PO):', after);
    console.log('✅ Hasło admina ustawione na:', NEW_PASSWORD);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('💥 Błąd w resetAdminPassword.js:', err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
})();
