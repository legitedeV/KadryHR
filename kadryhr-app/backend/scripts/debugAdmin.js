// scripts/debugAdmin.js
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

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('❌ Brak użytkownika o emailu:', email);
      process.exit(0);
    }

    console.log('✅ Znalazłem użytkownika:');
    console.log('   _id      :', user._id.toString());
    console.log('   email    :', user.email);
    console.log('   role     :', user.role);
    console.log('   password :', user.password); // zahashowane

    process.exit(0);
  } catch (err) {
    console.error('❌ Błąd debugowania admina:', err);
    process.exit(1);
  }
})();
