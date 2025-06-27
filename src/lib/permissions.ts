// FILE: src/lib/permissions.ts

export const PERMISSIONS = {
  // User management
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE: 'users:manage',

  // Role management
  ROLES_CREATE: 'roles:create',
  ROLES_READ: 'roles:read',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',
  ROLES_MANAGE: 'roles:manage',

  // Customer management
  CUSTOMERS_CREATE: 'customers:create',
  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_UPDATE: 'customers:update',
  CUSTOMERS_DELETE: 'customers:delete',
  CUSTOMERS_MANAGE: 'customers:manage',

  // Appointment management
  APPOINTMENTS_CREATE: 'appointments:create',
  APPOINTMENTS_READ: 'appointments:read',
  APPOINTMENTS_UPDATE: 'appointments:update',
  APPOINTMENTS_DELETE: 'appointments:delete',
  APPOINTMENTS_MANAGE: 'appointments:manage',
  
  // Stylist Management
  STYLISTS_CREATE: 'stylists:create',
  STYLISTS_READ: 'stylists:read',
  STYLISTS_UPDATE: 'stylists:update',
  STYLISTS_DELETE: 'stylists:delete',

  // Product Management
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_READ: 'products:read',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',

  // Service Management
  SERVICES_CREATE: 'services:create',
  SERVICES_READ: 'services:read',
  SERVICES_UPDATE: 'services:update',
  SERVICES_DELETE: 'services:delete',

  // Dashboard access
  DASHBOARD_READ: 'dashboard:read',
  DASHBOARD_MANAGE: 'dashboard:manage',

  // Day-end Closing management
  DAYEND_CREATE: 'dayend:create',
  DAYEND_READ: 'dayend:read',
  DAYEND_UPDATE: 'dayend:update',
  DAYEND_DELETE: 'dayend:delete',
  DAYEND_MANAGE: 'dayend:manage',

  // EB (Electricity Bill) management
  EB_UPLOAD: 'eb:upload',
  EB_VIEW_CALCULATE: 'eb:view_calculate',

  // Procurement management
  PROCUREMENT_CREATE: 'procurement:create',
  PROCUREMENT_READ: 'procurement:read',
  PROCUREMENT_UPDATE: 'procurement:update',
  PROCUREMENT_DELETE: 'procurement:delete',

  // --- 1. ADD NEW SETTINGS PERMISSIONS ---
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',

  ALL: '*'
} as const;

export const PERMISSION_CATEGORIES = {
  USER_MANAGEMENT: 'User Management',
  ROLE_MANAGEMENT: 'Role Management',
  CUSTOMER_MANAGEMENT: 'Customer Management',
  APPOINTMENT_MANAGEMENT: 'Appointment Management',
  BILLING_MANAGEMENT: 'Billing Management',
  DASHBOARD_ACCESS: 'Dashboard Access',
  SERVICES_MANAGEMENT: 'Services Management',
  STAFF_MANAGEMENT: 'Staff Management',
  INVENTORY_MANAGEMENT: 'Inventory Management',
  STYLIST_MANAGEMENT: 'Stylist Management',
  PRODUCT_MANAGEMENT: 'Product Management',
  SERVICE_MANAGEMENT: 'Service Management',
  // You already had this, which is perfect!
  SETTINGS_MANAGEMENT: 'Settings Management',
  REPORTS_ACCESS: 'Reports Access',
  EB_MANAGEMENT: 'EB Management',
  PROCUREMENT_MANAGEMENT: 'Procurement Management',
  DAYEND_MANAGEMENT: 'Day-end Closing Management'
} as const;

export const ALL_PERMISSIONS = [
  // ... (User, Role, Customer, Appointment management permissions are unchanged) ...

  // User Management
  { permission: PERMISSIONS.USERS_CREATE, description: 'Create new users', category: PERMISSION_CATEGORIES.USER_MANAGEMENT },
  { permission: PERMISSIONS.USERS_READ, description: 'View user information', category: PERMISSION_CATEGORIES.USER_MANAGEMENT },
  { permission: PERMISSIONS.USERS_UPDATE, description: 'Update user information', category: PERMISSION_CATEGORIES.USER_MANAGEMENT },
  { permission: PERMISSIONS.USERS_DELETE, description: 'Delete users', category: PERMISSION_CATEGORIES.USER_MANAGEMENT },
  { permission: PERMISSIONS.USERS_MANAGE, description: 'Full user management access', category: PERMISSION_CATEGORIES.USER_MANAGEMENT },

  // Role Management
  { permission: PERMISSIONS.ROLES_CREATE, description: 'Create new roles', category: PERMISSION_CATEGORIES.ROLE_MANAGEMENT },
  { permission: PERMISSIONS.ROLES_READ, description: 'View role information', category: PERMISSION_CATEGORIES.ROLE_MANAGEMENT },
  { permission: PERMISSIONS.ROLES_UPDATE, description: 'Update role information', category: PERMISSION_CATEGORIES.ROLE_MANAGEMENT },
  { permission: PERMISSIONS.ROLES_DELETE, description: 'Delete roles', category: PERMISSION_CATEGORIES.ROLE_MANAGEMENT },
  { permission: PERMISSIONS.ROLES_MANAGE, description: 'Full role management access', category: PERMISSION_CATEGORIES.ROLE_MANAGEMENT },

  // Customer Management
  { permission: PERMISSIONS.CUSTOMERS_CREATE, description: 'Create new customers', category: PERMISSION_CATEGORIES.CUSTOMER_MANAGEMENT },
  { permission: PERMISSIONS.CUSTOMERS_READ, description: 'View customer information', category: PERMISSION_CATEGORIES.CUSTOMER_MANAGEMENT },
  { permission: PERMISSIONS.CUSTOMERS_UPDATE, description: 'Update customer information', category: PERMISSION_CATEGORIES.CUSTOMER_MANAGEMENT },
  { permission: PERMISSIONS.CUSTOMERS_DELETE, description: 'Delete customers', category: PERMISSION_CATEGORIES.CUSTOMER_MANAGEMENT },
  { permission: PERMISSIONS.CUSTOMERS_MANAGE, description: 'Full customer management access', category: PERMISSION_CATEGORIES.CUSTOMER_MANAGEMENT },

  // Appointment Management
  { permission: PERMISSIONS.APPOINTMENTS_CREATE, description: 'Create new appointments', category: PERMISSION_CATEGORIES.APPOINTMENT_MANAGEMENT },
  { permission: PERMISSIONS.APPOINTMENTS_READ, description: 'View appointment information', category: PERMISSION_CATEGORIES.APPOINTMENT_MANAGEMENT },
  { permission: PERMISSIONS.APPOINTMENTS_UPDATE, description: 'Update appointment information', category: PERMISSION_CATEGORIES.APPOINTMENT_MANAGEMENT },
  { permission: PERMISSIONS.APPOINTMENTS_DELETE, description: 'Delete appointments', category: PERMISSION_CATEGORIES.APPOINTMENT_MANAGEMENT },
  { permission: PERMISSIONS.APPOINTMENTS_MANAGE, description: 'Full appointment management access', category: PERMISSION_CATEGORIES.APPOINTMENT_MANAGEMENT },

  // Dashboard Access
  { permission: PERMISSIONS.DASHBOARD_READ, description: 'View dashboard information', category: PERMISSION_CATEGORIES.DASHBOARD_ACCESS },
  { permission: PERMISSIONS.DASHBOARD_MANAGE, description: 'Full dashboard management access', category: PERMISSION_CATEGORIES.DASHBOARD_ACCESS },

  // EB Management
  { permission: PERMISSIONS.EB_UPLOAD, description: 'Upload morning and evening meter images', category: PERMISSION_CATEGORIES.EB_MANAGEMENT },
  { permission: PERMISSIONS.EB_VIEW_CALCULATE, description: 'View meter images and calculate units/costs', category: PERMISSION_CATEGORIES.EB_MANAGEMENT },

  // Procurement Management
  { permission: PERMISSIONS.PROCUREMENT_CREATE, description: 'Create procurement records', category: PERMISSION_CATEGORIES.PROCUREMENT_MANAGEMENT },
  { permission: PERMISSIONS.PROCUREMENT_READ, description: 'View procurement records', category: PERMISSION_CATEGORIES.PROCUREMENT_MANAGEMENT },
  { permission: PERMISSIONS.PROCUREMENT_UPDATE, description: 'Update procurement records', category: PERMISSION_CATEGORIES.PROCUREMENT_MANAGEMENT },
  { permission: PERMISSIONS.PROCUREMENT_DELETE, description: 'Delete procurement records', category: PERMISSION_CATEGORIES.PROCUREMENT_MANAGEMENT },

  // Day-end Closing Management
  { permission: PERMISSIONS.DAYEND_CREATE, description: 'Create day-end closing reports', category: PERMISSION_CATEGORIES.DAYEND_MANAGEMENT },
  { permission: PERMISSIONS.DAYEND_READ, description: 'View day-end closing reports', category: PERMISSION_CATEGORIES.DAYEND_MANAGEMENT },
  { permission: PERMISSIONS.DAYEND_UPDATE, description: 'Update day-end closing reports', category: PERMISSION_CATEGORIES.DAYEND_MANAGEMENT },
  { permission: PERMISSIONS.DAYEND_DELETE, description: 'Delete day-end closing reports', category: PERMISSION_CATEGORIES.DAYEND_MANAGEMENT },
  { permission: PERMISSIONS.DAYEND_MANAGE, description: 'Full day-end closing management access', category: PERMISSION_CATEGORIES.DAYEND_MANAGEMENT },

  // Stylist Management
  { permission: PERMISSIONS.STYLISTS_CREATE, description: 'Create new stylists', category: PERMISSION_CATEGORIES.STYLIST_MANAGEMENT },
  { permission: PERMISSIONS.STYLISTS_READ, description: 'View stylist information', category: PERMISSION_CATEGORIES.STYLIST_MANAGEMENT },
  { permission: PERMISSIONS.STYLISTS_UPDATE, description: 'Update stylist information', category: PERMISSION_CATEGORIES.STYLIST_MANAGEMENT },
  { permission: PERMISSIONS.STYLISTS_DELETE, description: 'Delete stylists', category: PERMISSION_CATEGORIES.STYLIST_MANAGEMENT },

  // Product Management
  { permission: PERMISSIONS.PRODUCTS_CREATE, description: 'Create new products, brands, and categories', category: PERMISSION_CATEGORIES.PRODUCT_MANAGEMENT },
  { permission: PERMISSIONS.PRODUCTS_READ, description: 'View product information', category: PERMISSION_CATEGORIES.PRODUCT_MANAGEMENT },
  { permission: PERMISSIONS.PRODUCTS_UPDATE, description: 'Update product information', category: PERMISSION_CATEGORIES.PRODUCT_MANAGEMENT },
  { permission: PERMISSIONS.PRODUCTS_DELETE, description: 'Delete products, brands, and categories', category: PERMISSION_CATEGORIES.PRODUCT_MANAGEMENT },

  // Service Management
  { permission: PERMISSIONS.SERVICES_CREATE, description: 'Create new services and categories', category: PERMISSION_CATEGORIES.SERVICE_MANAGEMENT },
  { permission: PERMISSIONS.SERVICES_READ, description: 'View service information', category: PERMISSION_CATEGORIES.SERVICE_MANAGEMENT },
  { permission: PERMISSIONS.SERVICES_UPDATE, description: 'Update service information', category: PERMISSION_CATEGORIES.SERVICE_MANAGEMENT },
  { permission: PERMISSIONS.SERVICES_DELETE, description: 'Delete services and categories', category: PERMISSION_CATEGORIES.SERVICE_MANAGEMENT },

  // --- 2. ADD NEW SETTINGS PERMISSIONS TO THE MAIN LIST ---
  { permission: PERMISSIONS.SETTINGS_VIEW, description: 'View application settings', category: PERMISSION_CATEGORIES.SETTINGS_MANAGEMENT },
  { permission: PERMISSIONS.SETTINGS_EDIT, description: 'Edit application settings (e.g., alert emails)', category: PERMISSION_CATEGORIES.SETTINGS_MANAGEMENT },

  // Super Admin
  { permission: PERMISSIONS.ALL, description: 'Full system access (Super Admin)', category: 'System Administration' }
];

// ... (helper functions like hasPermission, hasAnyPermission are unchanged)
export const hasPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  // Super admin has all permissions
  if (userPermissions.includes('*')) return true;

  // Direct permission match
  if (userPermissions.includes(requiredPermission)) return true;

  return false;
};

// Helper function to check multiple permissions (user needs ANY of the permissions)
export const hasAnyPermission = (userPermissions: string[], requiredPermissions: string[]): boolean => {
  return requiredPermissions.some(permission => hasPermission(userPermissions, permission));
};

// Helper function to check multiple permissions (user needs ALL of the permissions)
export const hasAllPermissions = (userPermissions: string[], requiredPermissions: string[]): boolean => {
  return requiredPermissions.every(permission => hasPermission(userPermissions, permission));
};

// Helper function to get permissions by category
export const getPermissionsByCategory = (category: string) => {
  return ALL_PERMISSIONS.filter(p => p.category === category);
};

// Helper function to get all categories
export const getAllCategories = () => {
  return Object.values(PERMISSION_CATEGORIES);
};


// Predefined role templates
export const ROLE_TEMPLATES = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    description: 'Full system access',
    permissions: [PERMISSIONS.ALL]
  },
  ADMIN: {
    name: 'Admin',
    description: 'Administrative access with most permissions',
    permissions: [
      PERMISSIONS.USERS_MANAGE,
      PERMISSIONS.ROLES_READ,
      PERMISSIONS.CUSTOMERS_MANAGE,
      PERMISSIONS.APPOINTMENTS_MANAGE,
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.EB_VIEW_CALCULATE,
      PERMISSIONS.PROCUREMENT_CREATE,
      PERMISSIONS.PROCUREMENT_READ,
      PERMISSIONS.PROCUREMENT_UPDATE,
      PERMISSIONS.PROCUREMENT_DELETE,
      PERMISSIONS.DAYEND_MANAGE,
      // --- 3. GRANT SETTINGS PERMISSIONS TO THE ADMIN ROLE ---
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.SETTINGS_EDIT,
    ]
  },
  MANAGER: {
    name: 'Manager',
    description: 'Management access for daily operations',
    permissions: [
      PERMISSIONS.CUSTOMERS_MANAGE,
      PERMISSIONS.APPOINTMENTS_MANAGE,
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.EB_UPLOAD,
      PERMISSIONS.PROCUREMENT_CREATE,
      PERMISSIONS.PROCUREMENT_READ,
      PERMISSIONS.PROCUREMENT_UPDATE,
      PERMISSIONS.PROCUREMENT_DELETE,
      PERMISSIONS.DAYEND_CREATE,
      PERMISSIONS.DAYEND_READ,
      PERMISSIONS.DAYEND_UPDATE
    ]
  },
  STAFF: {
    name: 'Staff',
    description: 'Basic staff access for appointments and customers',
    permissions: [
      PERMISSIONS.CUSTOMERS_READ,
      PERMISSIONS.CUSTOMERS_UPDATE,
      PERMISSIONS.APPOINTMENTS_READ,
      PERMISSIONS.APPOINTMENTS_UPDATE,
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.PROCUREMENT_READ,
      PERMISSIONS.DAYEND_READ
    ]
  },
  RECEPTIONIST: {
    name: 'Receptionist',
    description: 'Front desk operations access',
    permissions: [
      PERMISSIONS.CUSTOMERS_MANAGE,
      PERMISSIONS.APPOINTMENTS_MANAGE,
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.EB_UPLOAD,
      PERMISSIONS.DAYEND_CREATE,
      PERMISSIONS.DAYEND_READ
    ]
  }
};

// Type definitions (unchanged)
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
export type PermissionCategory = typeof PERMISSION_CATEGORIES[keyof typeof PERMISSION_CATEGORIES];

export interface PermissionInfo {
  permission: Permission;
  description: string;
  category: PermissionCategory | string;
}

export interface RoleTemplate {
  name: string;
  description: string;
  permissions: Permission[];
}