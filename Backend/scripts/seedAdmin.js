/**
 * Seed the initial admin account + admin role.
 * Run once at project setup:  npm run seed
 *
 * Reads ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD from .env.
 * Idempotent: skips creation if the admin already exists.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');
const { PERMISSIONS } = require('../models/Role');

async function seed() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/clasite';
  await mongoose.connect(uri);
  console.log('Connecté à MongoDB:', mongoose.connection.host);

  // 1. Admin role (full access, protected from deletion)
  let adminRole = await Role.findOne({ is_admin: true });
  if (!adminRole) {
    adminRole = await Role.create({
      role_name: 'admin',
      permissions: PERMISSIONS,
      is_admin: true,
      protected: true
    });
    console.log('Rôle admin créé.');
  } else {
    console.log('Rôle admin déjà présent.');
  }

  // 2. Admin user
  const username = process.env.ADMIN_USERNAME || 'admin';
  const existing = await User.findOne({ username });
  if (existing) {
    console.log(`Utilisateur "${username}" déjà présent — rien à faire.`);
  } else {
    await User.create({
      username,
      email: process.env.ADMIN_EMAIL || 'admin@clasite.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      id_role: adminRole._id,
      actif: true
    });
    console.log(`Admin "${username}" créé avec le mot de passe défini dans .env.`);
  }

  await mongoose.disconnect();
  console.log('Terminé.');
}

seed().catch(err => {
  console.error('Erreur de seed:', err);
  process.exit(1);
});
