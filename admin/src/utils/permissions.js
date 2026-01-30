// Role-based permission definitions for CivicKey Admin Console
// Role hierarchy: viewer < editor < admin < super-admin

export const ROLES = {
  VIEWER: 'viewer',
  EDITOR: 'editor',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super-admin'
};

// Role hierarchy for comparison (index = permission level)
export const ROLE_HIERARCHY = [
  ROLES.VIEWER,
  ROLES.EDITOR,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN
];

// Permission definitions for each feature
// true = can access, false = cannot access
// Functions return true/false based on role
export const PERMISSIONS = {
  // Dashboard - everyone can view
  dashboard: {
    view: () => true
  },

  // Announcements
  announcements: {
    view: () => true,
    create: (role) => hasMinRole(role, ROLES.EDITOR),
    edit: (role) => hasMinRole(role, ROLES.EDITOR),
    delete: (role) => hasMinRole(role, ROLES.EDITOR)
  },

  // Events
  events: {
    view: () => true,
    create: (role) => hasMinRole(role, ROLES.EDITOR),
    edit: (role) => hasMinRole(role, ROLES.EDITOR),
    delete: (role) => hasMinRole(role, ROLES.EDITOR)
  },

  // Facilities
  facilities: {
    view: () => true,
    create: (role) => hasMinRole(role, ROLES.EDITOR),
    edit: (role) => hasMinRole(role, ROLES.EDITOR),
    delete: (role) => hasMinRole(role, ROLES.EDITOR)
  },

  // Schedule (collection times, types, guidelines)
  schedule: {
    view: () => true,
    edit: (role) => hasMinRole(role, ROLES.EDITOR)
  },

  // Zones - Admin+ can create/edit/delete zones
  zones: {
    view: () => true,
    create: (role) => hasMinRole(role, ROLES.ADMIN),
    edit: (role) => hasMinRole(role, ROLES.ADMIN),
    delete: (role) => hasMinRole(role, ROLES.ADMIN)
  },

  // Admin Management - super-admin only
  adminManagement: {
    view: (role) => role === ROLES.SUPER_ADMIN,
    create: (role) => role === ROLES.SUPER_ADMIN,
    edit: (role) => role === ROLES.SUPER_ADMIN,
    delete: (role) => role === ROLES.SUPER_ADMIN
  },

  // Municipality Settings (edit existing municipality)
  municipalitySettings: {
    view: (role) => hasMinRole(role, ROLES.ADMIN),
    edit: (role) => hasMinRole(role, ROLES.ADMIN)
  },

  // Municipality Management - super-admin only (create new municipalities)
  municipalities: {
    view: (role) => role === ROLES.SUPER_ADMIN,
    create: (role) => role === ROLES.SUPER_ADMIN,
    edit: (role) => role === ROLES.SUPER_ADMIN,
    delete: (role) => role === ROLES.SUPER_ADMIN
  }
};

// Check if user has at least the minimum required role
export function hasMinRole(userRole, requiredRole) {
  if (!userRole) return false;
  if (userRole === ROLES.SUPER_ADMIN) return true;

  const userIndex = ROLE_HIERARCHY.indexOf(userRole);
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);

  return userIndex >= requiredIndex;
}

// Check specific permission
export function can(userRole, feature, action) {
  const featurePermissions = PERMISSIONS[feature];
  if (!featurePermissions) return false;

  const permissionCheck = featurePermissions[action];
  if (!permissionCheck) return false;

  return permissionCheck(userRole);
}

// Role display names
export const ROLE_DISPLAY_NAMES = {
  [ROLES.VIEWER]: 'Viewer',
  [ROLES.EDITOR]: 'Editor',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.SUPER_ADMIN]: 'Super Admin'
};

// Role descriptions for UI
export const ROLE_DESCRIPTIONS = {
  [ROLES.VIEWER]: 'Can view all data but cannot make any changes',
  [ROLES.EDITOR]: 'Can create/edit/delete announcements, events, and edit schedules',
  [ROLES.ADMIN]: 'Editor permissions plus zone management and municipality settings',
  [ROLES.SUPER_ADMIN]: 'Full system access including municipality and admin management'
};

// Get roles that a user can assign (can only assign roles below their own)
export function getAssignableRoles(userRole) {
  if (userRole !== ROLES.SUPER_ADMIN) return [];

  // Super-admin can assign all roles except super-admin
  return [ROLES.VIEWER, ROLES.EDITOR, ROLES.ADMIN];
}
