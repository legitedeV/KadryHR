#!/usr/bin/env node

/**
 * Universal script to manage user roles
 * Usage: 
 *   node manageRoles.js promote <email>           - Promote to super_admin
 *   node manageRoles.js demote <email>            - Demote to admin
 *   node manageRoles.js set <email> <role>        - Set specific role
 *   node manageRoles.js list                      - List all admins
 *   node manageRoles.js check <email>             - Check user role
 */

const mongoose = require('mongoose');
const User = require('../models/User');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kadryhr';

const VALID_ROLES = ['user', 'admin', 'super_admin'];

async function connectDB() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB\n');
}

async function closeDB() {
  await mongoose.connection.close();
  console.log('\n🔌 Database connection closed');
}

async function promoteUser(email) {
  await connectDB();
  
  console.log(`🔍 Looking for user: ${email}`);
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    console.error(`❌ User not found: ${email}`);
    await closeDB();
    process.exit(1);
  }

  console.log(`📋 Current: ${user.name} (${user.email}) - Role: ${user.role}`);

  if (user.role === 'super_admin') {
    console.log(`⚠️  User is already a super_admin!`);
    await closeDB();
    process.exit(0);
  }

  user.role = 'super_admin';
  await user.save();

  console.log(`✅ SUCCESS! Promoted to super_admin`);
  await closeDB();
}

async function demoteUser(email) {
  await connectDB();
  
  console.log(`🔍 Looking for user: ${email}`);
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    console.error(`❌ User not found: ${email}`);
    await closeDB();
    process.exit(1);
  }

  console.log(`📋 Current: ${user.name} (${user.email}) - Role: ${user.role}`);

  if (user.role === 'user') {
    console.log(`⚠️  User is already a regular user!`);
    await closeDB();
    process.exit(0);
  }

  user.role = 'admin';
  await user.save();

  console.log(`✅ SUCCESS! Demoted to admin`);
  await closeDB();
}

async function setRole(email, role) {
  if (!VALID_ROLES.includes(role)) {
    console.error(`❌ Invalid role: ${role}`);
    console.error(`   Valid roles: ${VALID_ROLES.join(', ')}`);
    process.exit(1);
  }

  await connectDB();
  
  console.log(`🔍 Looking for user: ${email}`);
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    console.error(`❌ User not found: ${email}`);
    await closeDB();
    process.exit(1);
  }

  console.log(`📋 Current: ${user.name} (${user.email}) - Role: ${user.role}`);

  if (user.role === role) {
    console.log(`⚠️  User already has role: ${role}`);
    await closeDB();
    process.exit(0);
  }

  user.role = role;
  await user.save();

  console.log(`✅ SUCCESS! Role changed to: ${role}`);
  await closeDB();
}

async function listAdmins() {
  await connectDB();
  
  console.log('📋 Listing all admins and super admins:\n');
  
  const admins = await User.find({
    role: { $in: ['admin', 'super_admin'] }
  }).select('name email role isActive').sort({ role: -1, name: 1 });

  if (admins.length === 0) {
    console.log('   No admins found');
  } else {
    admins.forEach((admin, index) => {
      const roleIcon = admin.role === 'super_admin' ? '👑' : '🔑';
      const statusIcon = admin.isActive ? '✅' : '❌';
      console.log(`${index + 1}. ${roleIcon} ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Active: ${statusIcon} ${admin.isActive}`);
      console.log('');
    });
  }

  await closeDB();
}

async function checkUser(email) {
  await connectDB();
  
  console.log(`🔍 Checking user: ${email}\n`);
  const user = await User.findOne({ email: email.toLowerCase() })
    .select('name email role isActive createdAt');

  if (!user) {
    console.error(`❌ User not found: ${email}`);
    await closeDB();
    process.exit(1);
  }

  const roleIcon = user.role === 'super_admin' ? '👑' : user.role === 'admin' ? '🔑' : '👤';
  const statusIcon = user.isActive ? '✅' : '❌';

  console.log(`${roleIcon} ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Active: ${statusIcon} ${user.isActive}`);
  console.log(`   Created: ${user.createdAt.toISOString()}`);

  await closeDB();
}

function showHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              KadryHR - User Role Management                   ║
╚═══════════════════════════════════════════════════════════════╝

Usage:
  node manageRoles.js <command> [arguments]

Commands:
  promote <email>           Promote user to super_admin
  demote <email>            Demote user to admin
  set <email> <role>        Set specific role (user/admin/super_admin)
  list                      List all admins and super admins
  check <email>             Check user's current role
  help                      Show this help message

Examples:
  node manageRoles.js promote admin@kadryhr.local
  node manageRoles.js demote user@example.com
  node manageRoles.js set user@example.com admin
  node manageRoles.js list
  node manageRoles.js check admin@kadryhr.local

Valid Roles:
  • user         - Regular employee (default)
  • admin        - Administrator (can manage most features)
  • super_admin  - Super Administrator (full access, can manage all users)
`);
}

// Main execution
(async () => {
  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  try {
    switch (command) {
      case 'promote':
        if (!arg1) {
          console.error('❌ Usage: node manageRoles.js promote <email>');
          process.exit(1);
        }
        await promoteUser(arg1);
        break;

      case 'demote':
        if (!arg1) {
          console.error('❌ Usage: node manageRoles.js demote <email>');
          process.exit(1);
        }
        await demoteUser(arg1);
        break;

      case 'set':
        if (!arg1 || !arg2) {
          console.error('❌ Usage: node manageRoles.js set <email> <role>');
          console.error(`   Valid roles: ${VALID_ROLES.join(', ')}`);
          process.exit(1);
        }
        await setRole(arg1, arg2);
        break;

      case 'list':
        await listAdmins();
        break;

      case 'check':
        if (!arg1) {
          console.error('❌ Usage: node manageRoles.js check <email>');
          process.exit(1);
        }
        await checkUser(arg1);
        break;

      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;

      default:
        console.error(`❌ Unknown command: ${command || '(none)'}\n`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Error:`, error.message);
    await closeDB();
    process.exit(1);
  }
})();
