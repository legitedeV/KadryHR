#!/usr/bin/env bash

# Script to promote user to super_admin via MongoDB shell
# Usage: ./promote-admin.sh <email>
# Example: ./promote-admin.sh admin@kadryhr.local

EMAIL="${1:-admin@kadryhr.local}"

echo "🔄 Promoting $EMAIL to super_admin..."

# MongoDB connection - adjust if needed
MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/kadryhr}"

# Extract database name from URI
DB_NAME=$(echo "$MONGO_URI" | sed 's/.*\///')

echo "📊 Database: $DB_NAME"
echo "📧 Email: $EMAIL"

# Run MongoDB command
mongosh "$MONGO_URI" --quiet --eval "
  const result = db.users.updateOne(
    { email: '$EMAIL' },
    { \$set: { role: 'super_admin' } }
  );
  
  if (result.matchedCount === 0) {
    print('❌ User not found: $EMAIL');
    quit(1);
  }
  
  if (result.modifiedCount > 0) {
    print('✅ SUCCESS! User promoted to super_admin');
    const user = db.users.findOne({ email: '$EMAIL' }, { name: 1, email: 1, role: 1 });
    print('📋 Updated user:');
    print('   Name: ' + user.name);
    print('   Email: ' + user.email);
    print('   Role: ' + user.role);
  } else {
    print('⚠️  User was already super_admin');
  }
"

echo ""
echo "✅ Done!"
