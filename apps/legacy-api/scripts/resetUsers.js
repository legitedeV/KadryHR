const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kadryhr';

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Połączono z MongoDB');

    const result = await User.deleteMany({});
    console.log('Usunięto użytkowników:', result.deletedCount);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Błąd przy kasowaniu użytkowników:', err);
    process.exit(1);
  }
})();
