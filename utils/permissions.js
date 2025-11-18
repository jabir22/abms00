// Define permission groups with translations
export const PERMISSION_GROUPS = {
  profile: 'প্রোফাইল',
  roles: 'রোল',
  users: 'ইউজার',
  accounts: 'অ্যাকাউন্টস',
  transactions: 'ট্রানজ্যাকশন',
  products: 'প্রডাক্টস',
  inventory: 'ইনভেন্টরি',
  suppliers: 'সাপ্লায়ার',
  purchase: 'পারচেজ',
  sales: 'সেলস',
  reports: 'রিপোর্ট',
  system: 'সিস্টেম'
  , areas: 'এলাকা'
};

// Extended permission set for account & business management app
export const PERMISSIONS = {
  // Profile permissions
  view_profile: { name: 'view_profile', label: 'প্রোফাইল দেখা', group: 'profile' },
  edit_profile: { name: 'edit_profile', label: 'প্রোফাইল এডিট', group: 'profile' },
  view_all_profiles: { name: 'view_all_profiles', label: 'সকল প্রোফাইল দেখা', group: 'profile' },

  // Role management
  create_role: { name: 'create_role', label: 'রোল তৈরি', group: 'roles' },
  edit_role: { name: 'edit_role', label: 'রোল এডিট', group: 'roles' },
  delete_role: { name: 'delete_role', label: 'রোল ডিলিট', group: 'roles' },
  assign_role: { name: 'assign_role', label: 'রোল অ্যাসাইন', group: 'roles' },

  // User management
  create_user: { name: 'create_user', label: 'ইউজার তৈরি', group: 'users' },
  edit_user: { name: 'edit_user', label: 'ইউজার এডিট', group: 'users' },
  delete_user: { name: 'delete_user', label: 'ইউজার ডিলিট', group: 'users' },
  view_users: { name: 'view_users', label: 'ইউজার লিস্ট দেখা', group: 'users' },

  // Accounts & transactions
  view_accounts: { name: 'view_accounts', label: 'অ্যাকাউন্ট দেখুন', group: 'accounts' },
  create_account: { name: 'create_account', label: 'অ্যাকাউন্ট তৈরি', group: 'accounts' },
  edit_account: { name: 'edit_account', label: 'অ্যাকাউন্ট এডিট', group: 'accounts' },
  delete_account: { name: 'delete_account', label: 'অ্যাকাউন্ট ডিলিট', group: 'accounts' },

  view_transactions: { name: 'view_transactions', label: 'ট্রানজ্যাকশন দেখুন', group: 'transactions' },
  create_transaction: { name: 'create_transaction', label: 'ট্রানজ্যাকশন তৈরি', group: 'transactions' },
  edit_transaction: { name: 'edit_transaction', label: 'ট্রানজ্যাকশন এডিট', group: 'transactions' },
  delete_transaction: { name: 'delete_transaction', label: 'ট্রানজ্যাকশন ডিলিট', group: 'transactions' },

  // Products & inventory
  view_products: { name: 'view_products', label: 'প্রডাক্ট দেখুন', group: 'products' },
  create_product: { name: 'create_product', label: 'প্রডাক্ট তৈরি', group: 'products' },
  edit_product: { name: 'edit_product', label: 'প্রডাক্ট এডিট', group: 'products' },
  delete_product: { name: 'delete_product', label: 'প্রডাক্ট ডিলিট', group: 'products' },

  view_stocks: { name: 'view_stocks', label: 'স্টক দেখুন', group: 'inventory' },
  adjust_stock: { name: 'adjust_stock', label: 'স্টক সমন্বয়', group: 'inventory' },

  // Suppliers / Purchase / Sales
  view_suppliers: { name: 'view_suppliers', label: 'সাপ্লায়ার দেখুন', group: 'suppliers' },
  create_supplier: { name: 'create_supplier', label: 'সাপ্লায়ার তৈরি', group: 'suppliers' },

  create_purchase: { name: 'create_purchase', label: 'পারচেজ তৈরি', group: 'purchase' },
  view_purchases: { name: 'view_purchases', label: 'পারচেজ দেখুন', group: 'purchase' },

  create_sale: { name: 'create_sale', label: 'সেল তৈরি', group: 'sales' },
  view_sales: { name: 'view_sales', label: 'সেল দেখুন', group: 'sales' },

  // Reporting & export
  view_reports: { name: 'view_reports', label: 'রিপোর্ট দেখা', group: 'reports' },
  export_data: { name: 'export_data', label: 'ডেটা এক্সপোর্ট', group: 'reports' },

  // System & settings
  assign_permission: { name: 'assign_permission', label: 'পারমিশন দেওয়া', group: 'system' },
  manage_settings: { name: 'manage_settings', label: 'সেটিংস পরিবর্তন', group: 'system' },
  view_logs: { name: 'view_logs', label: 'লগ দেখা', group: 'system' },
  manage_system: { name: 'manage_system', label: 'সিস্টেম ম্যানেজ', group: 'system' },
  backup_restore: { name: 'backup_restore', label: 'ব্যাকআপ ও রিস্টোর', group: 'system' },
  import_data: { name: 'import_data', label: 'ডেটা ইম্পোর্ট', group: 'system' }
};

// Area management permissions
PERMISSIONS.view_areas = { name: 'view_areas', label: 'এলাকা তালিকা দেখা', group: 'areas' };
PERMISSIONS.read_area = { name: 'read_area', label: 'এলাকা বিস্তারিত দেখা', group: 'areas' };
PERMISSIONS.create_area = { name: 'create_area', label: 'এলাকা তৈরি', group: 'areas' };
PERMISSIONS.update_area = { name: 'update_area', label: 'এলাকা এডিট', group: 'areas' };
PERMISSIONS.delete_area = { name: 'delete_area', label: 'এলাকা ডিলিট', group: 'areas' };
PERMISSIONS.assign_area = { name: 'assign_area', label: 'এলাকা অ্যাসাইন', group: 'areas' };

// Default role permissions
export const DEFAULT_ROLE_PERMISSIONS = {
  owner: Object.values(PERMISSIONS).map(p => p.name), // Owner gets all permissions

  admin: [
    'view_profile', 'edit_profile', 'view_all_profiles',
    'create_user', 'edit_user', 'view_users',
    'assign_role',
    'view_accounts', 'create_account', 'view_transactions', 'create_transaction',
    'view_products', 'create_product', 'view_stocks',
    'view_suppliers', 'create_supplier',
    'view_purchases', 'create_purchase', 'view_sales', 'create_sale',
    'view_reports', 'export_data', 'view_logs',
    // Areas
    'view_areas', 'read_area', 'create_area', 'update_area', 'delete_area', 'assign_area'
  ],

  manager: [
    'view_profile', 'edit_profile',
    'view_users', 'view_accounts', 'view_transactions',
    'view_products', 'view_stocks', 'view_suppliers',
    'view_purchases', 'view_sales', 'view_reports',
    // Areas (manager: view, read, assign, update)
    'view_areas', 'read_area', 'assign_area', 'update_area'
  ],

  user: [
    'view_profile', 'edit_profile',
    'view_accounts', 'view_transactions',
    // Areas - read/view only
    'view_areas', 'read_area'
  ]
};

// Helper functions
export const getPermission = (name) => PERMISSIONS[name];

export const getPermissionLabel = (name) => PERMISSIONS[name]?.label || name;

export const getPermissionsByGroup = (group) => {
  return Object.values(PERMISSIONS).filter(p => p.group === group);
};

export const isValidPermission = (name) => !!PERMISSIONS[name];

export const validatePermissions = (permissions) => {
  if (!Array.isArray(permissions)) return false;
  return permissions.every(p => isValidPermission(p));
};

export const getAllPermissions = () => Object.values(PERMISSIONS);

export const getAllGroups = () => Object.keys(PERMISSION_GROUPS);