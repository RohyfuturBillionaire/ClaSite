const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Role = require('../models/Role');
const authenticateToken = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');

// All user management is admin / 'users' permission only
router.use(authenticateToken, authorize('users'));

// GET /api/users — list with optional ?role=<name>&search=<text>&page&limit
router.get('/', async (req, res) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (role) {
      const roleDoc = await Role.findOne({ role_name: role });
      if (!roleDoc) return res.json({ data: [], total: 0, page: Number(page), limit: Number(limit) });
      filter.id_role = roleDoc._id;
    }
    if (search) filter.username = { $regex: search, $options: 'i' };

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .populate('id_role')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ data: users, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('id_role');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/users — admin adds a new user
router.post('/', async (req, res) => {
  try {
    const { username, email, password, id_role, actif } = req.body;
    if (!username || !password || !id_role) {
      return res.status(400).json({ message: 'username, password et id_role sont requis' });
    }
    if (await User.findOne({ username })) {
      return res.status(400).json({ message: 'Ce nom d\'utilisateur existe déjà' });
    }

    const user = new User({ username, email, password, id_role, actif });
    await user.save(); // pre-save hook hashes the password

    const created = await User.findById(user._id).select('-password').populate('id_role');
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/users/:id — update (password optional; re-hashed via save())
router.put('/:id', async (req, res) => {
  try {
    const { username, email, id_role, actif, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    if (username !== undefined) user.username = username;
    if (email !== undefined) user.email = email;
    if (id_role !== undefined) user.id_role = id_role;
    if (actif !== undefined) user.actif = actif;
    if (password) user.password = password; // triggers re-hash on save

    await user.save();
    const updated = await User.findById(user._id).select('-password').populate('id_role');
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    if (req.params.id === req.currentUser._id.toString()) {
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json({ message: 'Utilisateur supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
