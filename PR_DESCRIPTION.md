# 🔐 Granular Module-Based Permissions System & Role Management Tools

## 📋 Overview

This PR adds comprehensive role management scripts and tools for promoting users to super_admin and managing permissions through SSH/CLI.

## ✨ What's New

### 🛠️ Role Management Scripts

#### 1. **Universal Role Manager** (`backend/scripts/manageRoles.js`)
Complete CLI tool for managing user roles with multiple commands:
- `promote <email>` - Promote user to super_admin
- `demote <email>` - Demote user to admin
- `set <email> <role>` - Set specific role (user/admin/super_admin)
- `list` - List all admins and super admins
- `check <email>` - Check user's current role
- `help` - Show help message

**Example:**
```bash
cd /home/deploy/apps/kadryhr-app/backend
node scripts/manageRoles.js promote admin@kadryhr.local
```

#### 2. **Simple Promotion Script** (`backend/scripts/promoteToSuperAdmin.js`)
Quick script for promoting a single user to super_admin.

#### 3. **Bash Script** (`backend/scripts/promote-admin.sh`)
Shell script alternative using MongoDB shell directly.

#### 4. **Interactive Menu** (`SSH_QUICK_COMMANDS.sh`)
User-friendly interactive menu for SSH sessions with:
- Promote user to super_admin
- List all admins
- Check user role
- Verify MongoDB connection
- Built-in help system

### 📚 Documentation Files

1. **`QUICK_START_SUPER_ADMIN.md`** - Quick start guide
2. **`COPY_PASTE_COMMANDS.txt`** - Ready-to-copy SSH commands
3. **`PROMOTE_ADMIN_COMMANDS.txt`** - Detailed instructions with multiple methods
4. **`backend/scripts/README_ROLES.md`** - Complete documentation

## 🎯 Use Cases

### Promote User to Super Admin
```bash
# Method 1: Universal script (RECOMMENDED)
cd /home/deploy/apps/kadryhr-app/backend
node scripts/manageRoles.js promote admin@kadryhr.local

# Method 2: Simple script
node scripts/promoteToSuperAdmin.js admin@kadryhr.local

# Method 3: Bash script
./scripts/promote-admin.sh admin@kadryhr.local

# Method 4: Direct MongoDB
mongosh mongodb://localhost:27017/kadryhr --eval "db.users.updateOne({email:'admin@kadryhr.local'},{\$set:{role:'super_admin'}})"
```

### List All Admins
```bash
node scripts/manageRoles.js list
```

### Check User Role
```bash
node scripts/manageRoles.js check admin@kadryhr.local
```

### Interactive Menu
```bash
cd /home/deploy/apps/kadryhr-app
./SSH_QUICK_COMMANDS.sh
```

## 🔑 Role Hierarchy

### 👑 Super Admin
- Can initialize permissions globally
- Can manage permissions for ALL users (including other super admins)
- Can promote users to any role
- Full access to all modules

### 🔑 Admin
- Can manage permissions for regular users and other admins
- **CANNOT** edit super_admin permissions
- **CANNOT** initialize permissions globally
- Full access to all modules

### 👤 User (Regular Employee)
- No access to permissions management
- Can receive module permissions from admin
- Permissions unlock specific admin features

## 📦 Files Added

### Scripts
- `backend/scripts/manageRoles.js` (7.3KB) - Universal role manager
- `backend/scripts/promoteToSuperAdmin.js` (2.1KB) - Simple promotion script
- `backend/scripts/promote-admin.sh` (1.2KB) - Bash script
- `SSH_QUICK_COMMANDS.sh` (12KB) - Interactive menu

### Documentation
- `QUICK_START_SUPER_ADMIN.md` - Quick start guide
- `COPY_PASTE_COMMANDS.txt` (7.6KB) - Ready commands
- `PROMOTE_ADMIN_COMMANDS.txt` (5.6KB) - Detailed instructions
- `backend/scripts/README_ROLES.md` - Complete documentation

## ✅ Testing

All scripts have been tested and verified:
- ✅ Node.js syntax validation
- ✅ Bash syntax validation
- ✅ MongoDB connection handling
- ✅ Error handling and user feedback
- ✅ Help messages and documentation

## 🚀 Deployment

No deployment changes required. Scripts are ready to use immediately after merge.

## ⚠️ Important Notes

1. **User must logout and login** after role change for changes to take effect
2. **Always keep at least one super_admin** in the system
3. **Backup database** before making bulk role changes
4. Scripts require MongoDB to be running

## 📖 Documentation

Complete documentation available in:
- `QUICK_START_SUPER_ADMIN.md` - Quick start
- `COPY_PASTE_COMMANDS.txt` - Copy-paste commands
- `backend/scripts/README_ROLES.md` - Full documentation

## 🔗 Related

This PR complements the existing permissions system implemented in previous PRs by adding essential CLI tools for role management.

---

**Ready to merge!** 🎉
