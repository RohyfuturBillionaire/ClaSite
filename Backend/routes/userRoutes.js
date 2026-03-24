const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Role = require('../models/Role');
const Boutique = require('../models/Boutique');
const authenticateToken = require('../middleware/authMiddleware');

// GET users (with filters: role, unassigned, search, pagination)
router.get('/', async (req, res) => {
  try {
    const { role, unassigned, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    // Filter by role name
    if (role) {
      const roleDoc = await Role.findOne({ role_name: role });
      if (!roleDoc) return res.json({ data: [], total: 0, page: Number(page), limit: Number(limit) });
      filter.id_role = roleDoc._id;
    }

    // Search by username (case-insensitive)
    if (search) {
      filter.username = { $regex: search, $options: 'i' };
    }

    const total = await User.countDocuments(filter);

    let users = await User.find(filter)
      .select('-password')
      .populate('id_role')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    // Exclude users already assigned to an active boutique
    if (unassigned === 'true') {
      const assignedBoutiques = await Boutique.find({ user_proprietaire: { $ne: null }, status: true })
        .select('user_proprietaire');
      const assignedUserIds = assignedBoutiques.map(b => b.user_proprietaire.toString());
      users = users.filter(u => !assignedUserIds.includes(u._id.toString()));
    }

    // Enrich with boutique association info
    const boutiqueUsers = await Boutique.find({ user_proprietaire: { $ne: null }, status: true })
      .select('user_proprietaire nom _id');
    const boutiqueMap = {};
    boutiqueUsers.forEach(b => {
      boutiqueMap[b.user_proprietaire.toString()] = { boutiqueId: b._id, boutiqueNom: b.nom };
    });

    const enrichedUsers = users.map(u => {
      const obj = u.toObject();
      obj.boutique = boutiqueMap[obj._id.toString()] || null;
      return obj;
    });

    res.json({ data: enrichedUsers, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('id_role');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { username, password, id_role } = req.body;
    if (!username || !password || !id_role) {
      return res.status(400).json({ message: 'Username, password and role are required' });
    } 
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    } 
    const newUser = new User({ username, password, id_role });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } 
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { username, email, id_role } = req.body;
    const updates = {};
    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;
    if (id_role !== undefined) updates.id_role = id_role;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true })
      .select('-password')
      .populate('id_role');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
