/**
 * Skrypt inicjalizacyjny dla systemu uprawnień
 * 
 * Uruchom: node backend/scripts/initPermissions.js
 * 
 * Ten skrypt:
 * 1. Tworzy wszystkie domyślne uprawnienia w bazie danych
 * 2. Może być uruchomiony wielokrotnie (używa upsert)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { initializePermissions } = require('../controllers/permissionController');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kadryhr';

async function init() {
  try {
    console.log('🔌 Łączenie z bazą danych...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Połączono z MongoDB');

    console.log('🔐 Inicjalizacja uprawnień...');
    await initializePermissions();
    console.log('✅ Uprawnienia zostały zainicjalizowane');

    console.log('✨ Gotowe!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Błąd:', error.message);
    process.exit(1);
  }
}

init();
