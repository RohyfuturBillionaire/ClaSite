const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticateToken = require('../middleware/authMiddleware');

function signToken(user) {
  return jwt.sign(
    { userId: user._id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.TOKEN_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Identifiant et mot de passe requis' });
    }

    const user = await User.findOne({ username }).populate('id_role');
    if (!user) return res.status(401).json({ message: 'Identifiants invalides' });
    if (user.actif === false) return res.status(403).json({ message: 'Compte désactivé' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Identifiants invalides' });

    const token = signToken(user);
    const safeUser = user.toObject();
    delete safeUser.password;

    res.json({ token, user: safeUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/me — current user from token
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password').populate('id_role');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
