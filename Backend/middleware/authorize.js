const User = require('../models/User');

/**
 * Authorization middleware. Must run AFTER authenticateToken (which sets req.user.userId).
 * Loads the current user + role from DB, attaches them to req, then checks access.
 *
 * Usage:
 *   authorize()            -> any authenticated, active user
 *   authorize('produits')  -> admin, or a role whose permissions include 'produits'
 *   authorize('users', 'roles') -> admin, or a role with ANY of the listed permissions
 */
function authorize(...required) {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId).populate('id_role');
      if (!user) return res.status(401).json({ message: 'Utilisateur introuvable' });
      if (user.actif === false) return res.status(403).json({ message: 'Compte désactivé' });

      req.currentUser = user;
      req.role = user.id_role;

      // No specific permission required -> just needs to be authenticated
      if (required.length === 0) return next();

      const role = user.id_role;
      if (role && role.is_admin) return next();

      const perms = (role && role.permissions) || [];
      const allowed = required.some(p => perms.includes(p));
      if (!allowed) {
        return res.status(403).json({ message: 'Accès refusé : permission insuffisante' });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
}

// Convenience guard: admin only
const requireAdmin = authorize.requireAdmin = (req, res, next) =>
  authorize()(req, res, () => {
    if (!req.role || !req.role.is_admin) {
      return res.status(403).json({ message: 'Accès réservé à l\'administrateur' });
    }
    next();
  });

module.exports = authorize;
module.exports.requireAdmin = requireAdmin;
