const Role = require('../models/Role');
const User = require('../models/User');
const Boutique = require('../models/Boutique');

/**
 * Middleware that ensures the authenticated user (role=boutique)
 * is linked to an active boutique. Blocks access otherwise.
 * Must be used AFTER authenticateToken.
 */
const requireBoutique = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).populate('id_role');
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur introuvable' });
    }

    const roleName = user.id_role?.role_name?.toLowerCase();

    // Only enforce for boutique role users
    if (roleName !== 'boutique') {
      return next();
    }

    const boutique = await Boutique.findOne({
      user_proprietaire: user._id,
      status: true
    });

    if (!boutique) {
      return res.status(403).json({
        message: 'Aucune boutique associee a votre compte. Contactez l\'administrateur.',
        code: 'NO_BOUTIQUE'
      });
    }

    // Attach boutique info to request for downstream use
    req.boutique = boutique;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = requireBoutique;
