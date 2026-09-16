const { ApiError } = require('./errorHandler');

/**
 * Restricts a route to the given roles. `super_admin` passes every guard —
 * it is the platform operator role and supports users inside their own portals.
 *
 * Usage: `router.use(requireRole('agency'))`
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Unauthenticated'));

    if (req.user.role === 'super_admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }
    next(new ApiError(403, 'Forbidden: insufficient role'));
  };
}

/** Strict variant — `super_admin` does not get an implicit pass. */
function requireExactRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Unauthenticated'));
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden: insufficient role'));
    }
    next();
  };
}

module.exports = { requireRole, requireExactRole };
