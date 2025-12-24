const mongoose = require('mongoose');

/**
 * Model Permission - definiuje dostępne uprawnienia w systemie
 * Każde uprawnienie odpowiada modułowi lub funkcjonalności aplikacji
 */
const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    module: {
      type: String,
      required: true,
      enum: [
        'dashboard',
        'employees',
        'payroll',
        'schedule',
        'time_tracking',
        'chat',
        'reports',
        'requests',
        'leaves',
        'notifications',
        'settings',
        'self_service',
      ],
    },
    category: {
      type: String,
      enum: ['view', 'create', 'edit', 'delete', 'manage'],
      default: 'view',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index dla szybszego wyszukiwania
permissionSchema.index({ name: 1 });
permissionSchema.index({ module: 1 });

module.exports = mongoose.model('Permission', permissionSchema);
