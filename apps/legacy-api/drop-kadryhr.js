const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kadryhr';

(async () => {
  try {
    console.log('Łączenie z MongoDB:', uri);
    await mongoose.connect(uri);
    console.log('Połączono, czyszczę bazę...');

    await mongoose.connection.db.dropDatabase();
    console.log('Baza została usunięta.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Błąd podczas usuwania bazy:', err);
    process.exit(1);
  }
})();

