const mongoose = require('mongoose');

// Permissions correspond to the admin dashboard sections.
// A role grants access to the sections listed in `permissions`.
const PERMISSIONS = [
  'stats',       // Vue globale
  'produits',    // Gestion des produits
  'commandes',   // Gestion des commandes
  'collections', // Gestion des collections
  'contenu',     // Gestion du contenu
  'users',       // Gestion des utilisateurs
  'roles'        // Gestion des rôles
];

const RoleSchema = new mongoose.Schema({
  role_name: { type: String, required: true, unique: true },
  permissions: [{ type: String, enum: PERMISSIONS }],
  is_admin: { type: Boolean, default: false }, // full access
  protected: { type: Boolean, default: false } // cannot be deleted (e.g. admin role)
}, { timestamps: true });

module.exports = mongoose.model('Role', RoleSchema);
module.exports.PERMISSIONS = PERMISSIONS;
