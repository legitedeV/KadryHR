// scripts/createAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kadryhr';

(async () => {
  try {
    console.log('Łączenie z MongoDB:', MONGO_URI);
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const email = 'admin@kadryhr.local';
    const password = 'Admin123!';

    let user = await User.findOne({ email });

    if (user) {
      console.log('✅ Admin już istnieje w bazie:');
      console.log('   _id   :', user._id.toString());
      console.log('   email:', user.email);
      process.exit(0);
    }

    user = await User.create({
      email,
      password,         // UWAGA: zakładamy, że User ma pre('save') z bcrypt
      role: 'admin',
      name: 'Super Admin',
    });

    console.log('✅ Utworzono nowego admina:');
    console.log('   Email :', email);
    console.log('   Hasło :', password);
    console.log('   _id   :', user._id.toString());

    process.exit(0);
  } catch (err) {
    console.error('❌ Błąd przy tworzeniu admina:', err);
    process.exit(1);
  }
})();
