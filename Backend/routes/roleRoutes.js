const express = require('express');
const router = express.Router();
const Role = require('../models/Role');
const User = require('../models/User');
const { PERMISSIONS } = require('../models/Role');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');

router.use(authenticateToken);

// GET /api/roles/permissions — the list of assignable permissions (for the UI)
router.get('/permissions', authorize('users', 'roles'), (req, res) => {
  res.json(PERMISSIONS);
});

// GET /api/roles — list roles (also needed by the "add user" form)
router.get('/', authorize('users', 'roles'), async (req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: 1 });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/roles — create a role with a set of permissions
router.post('/', authorize('roles'), async (req, res) => {
  try {
    const { role_name, permissions } = req.body;
    if (!role_name) return res.status(400).json({ message: 'role_name requis' });
    if (await Role.findOne({ role_name })) {
      return res.status(400).json({ message: 'Ce rôle existe déjà' });
    }
    const role = await Role.create({
      role_name,
      permissions: (permissions || []).filter(p => PERMISSIONS.includes(p))
    });
    res.status(201).json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/roles/:id — rename / change permissions
router.put('/:id', authorize('roles'), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: 'Rôle introuvable' });
    if (role.is_admin) {
      return res.status(400).json({ message: 'Le rôle admin ne peut pas être modifié' });
    }

    const { role_name, permissions } = req.body;
    if (role_name !== undefined) role.role_name = role_name;
    if (permissions !== undefined) {
      role.permissions = permissions.filter(p => PERMISSIONS.includes(p));
    }
    await role.save();
    res.json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/roles/:id — blocked if protected or still in use
router.delete('/:id', authorize('roles'), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: 'Rôle introuvable' });
    if (role.protected || role.is_admin) {
      return res.status(400).json({ message: 'Ce rôle est protégé et ne peut pas être supprimé' });
    }
    const inUse = await User.countDocuments({ id_role: role._id });
    if (inUse > 0) {
      return res.status(400).json({ message: `Rôle utilisé par ${inUse} utilisateur(s)` });
    }
    await role.deleteOne();
    res.json({ message: 'Rôle supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
