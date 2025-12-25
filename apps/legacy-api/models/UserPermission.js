const mongoose = require('mongoose');

/**
 * Model UserPermission - przypisanie uprawnień do użytkowników
 * Pozwala na granularną kontrolę dostępu dla każdego użytkownika
 */
const userPermissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    permissions: [
      {
        type: String,
        required: true,
      },
    ],
    // Dodatkowe ograniczenia (opcjonalne)
    restrictions: {
      // Czy może widzieć tylko swoje dane
      ownDataOnly: {
        type: Boolean,
        default: false,
      },
      // Czy może widzieć dane swojego zespołu
      teamDataOnly: {
        type: Boolean,
        default: false,
      },
      // Maksymalna liczba rekordów do wyświetlenia
      maxRecords: {
        type: Number,
        default: null,
      },
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      default: null,
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
userPermissionSchema.index({ user: 1 });
userPermissionSchema.index({ user: 1, isActive: 1 });

// Metoda do sprawdzania czy użytkownik ma dane uprawnienie
userPermissionSchema.methods.hasPermission = function (permissionName) {
  if (!this.isActive) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  return this.permissions.includes(permissionName);
};

module.exports = mongoose.model('UserPermission', userPermissionSchema);
