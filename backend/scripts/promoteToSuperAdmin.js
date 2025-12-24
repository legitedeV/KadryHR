#!/usr/bin/env node

/**
 * Script to promote a user to super_admin role
 * Usage: node promoteToSuperAdmin.js <email>
 * Example: node promoteToSuperAdmin.js admin@kadryhr.local
 */

const mongoose = require('mongoose');
const User = require('../models/User');

// MongoDB connection string - adjust if needed
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kadryhr';

async function promoteToSuperAdmin(email) {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log(`\n🔍 Looking for user: ${email}`);
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`\n📋 Current user details:`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);

    if (user.role === 'super_admin') {
      console.log(`\n⚠️  User is already a super_admin!`);
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`\n🔄 Promoting user to super_admin...`);
    user.role = 'super_admin';
    await user.save();

    console.log(`\n✅ SUCCESS! User promoted to super_admin`);
    console.log(`\n📋 Updated user details:`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   New Role: ${user.role}`);

    await mongoose.connection.close();
    console.log(`\n🔌 Database connection closed`);
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Error:`, error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: node promoteToSuperAdmin.js <email>');
  console.error('   Example: node promoteToSuperAdmin.js admin@kadryhr.local');
  process.exit(1);
}

promoteToSuperAdmin(email);
