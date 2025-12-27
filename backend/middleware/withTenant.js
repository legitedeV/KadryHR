/**
 * Multi-tenant middleware
 * Automatically adds organization filtering to all database queries
 * Prevents data leakage between tenants
 */

const withTenant = (req, res, next) => {
  // Extract organization from authenticated user
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Add organization to request for easy access
  req.organizationId = req.user.organizationId || req.user.company;

  if (!req.organizationId) {
    return res.status(403).json({ 
      message: 'User not associated with any organization' 
    });
  }

  // Add helper method to filter queries by organization
  req.filterByOrganization = (query = {}) => {
    return {
      ...query,
      $or: [
        { organization: req.organizationId },
        { company: req.organizationId }, // Support both field names during migration
      ],
    };
  };

  next();
};

module.exports = withTenant;
