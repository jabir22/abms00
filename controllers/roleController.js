import db from '../config/db.js';
import { isValidPermission, validatePermissions } from '../utils/permissions.js';
import { insertRole } from '../models/role.model.js';

// Get all roles for current tenant
export const getRoles = async (req, res) => {
    try {
        // Exclude soft-deleted roles
        const [roles] = await db.query(
            `SELECT r.*, u.name_en AS created_by_name, t.name AS tenant_name,
                    (SELECT COUNT(*) FROM users u2 WHERE u2.role_id = r.id AND u2.deleted_at IS NULL) AS users_count,
                    (SELECT GROUP_CONCAT(rp.permission_name SEPARATOR ',') FROM role_permissions rp WHERE rp.role_id = r.id) AS permissions_list
             FROM roles r
             LEFT JOIN users u ON r.created_by = u.id
             LEFT JOIN tenants t ON r.tenant_id = t.id
             WHERE r.tenant_id = ? AND r.deleted_at IS NULL
             ORDER BY r.created_at DESC`,
            [req.session.user.tenant_id]
        );

        // Process permissions for each role
        for (let role of roles) {
            try {
                // permissions may be stored in roles.permissions JSON or in role_permissions table
                if (role.permissions && typeof role.permissions === 'string') {
                    role.permissions = JSON.parse(role.permissions);
                } else if (role.permissions_list && typeof role.permissions_list === 'string') {
                    role.permissions = role.permissions_list.split(',').filter(Boolean);
                } else {
                    role.permissions = role.permissions || [];
                }
            } catch (e) {
                console.error('Error parsing role permissions:', e);
                role.permissions = [];
            }

            // Ensure numeric counts
            role.users_count = role.users_count ? Number(role.users_count) : 0;
            // If roles table has updated_by, try to resolve updated_by_name
            try {
                if (role.updated_by) {
                    const [upd] = await db.query('SELECT name_en FROM users WHERE id = ? LIMIT 1', [role.updated_by]);
                    role.updated_by_name = (upd && upd[0]) ? upd[0].name_en : null;
                } else {
                    role.updated_by_name = role.updated_by_name || null;
                }
            } catch (e) {
                role.updated_by_name = null;
            }
        }

        res.json({ success: true, roles, meta: { total_roles: roles.length } });
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({
            success: false,
            message: 'রোল তথ্য লোড করতে সমস্যা হয়েছে'
        });
    }
};

// Force-delete a role: reassign any users to a fallback role and soft-delete the role
export const forceDeleteRole = async (req, res) => {
    const { id } = req.params;

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Check role exists and belongs to tenant
        const [roleRows] = await connection.query(
            'SELECT id, slug, tenant_id FROM roles WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
            [id, req.session.user.tenant_id]
        );

        if (!roleRows.length) {
            return res.status(404).json({ success: false, message: 'রোল পাওয়া যায়নি' });
        }

        const role = roleRows[0];

        // Prevent deletion of owner role
        if (role.slug === 'owner') {
            return res.status(400).json({ success: false, message: 'Owner রোল ডিলিট করা যাবে না' });
        }

        // Find fallback role (user) in this tenant
        const [fallbackRows] = await connection.query(
            "SELECT id FROM roles WHERE slug = 'user' AND tenant_id = ? AND deleted_at IS NULL LIMIT 1",
            [role.tenant_id]
        );

        let fallbackRoleId;
        if (fallbackRows.length) {
            fallbackRoleId = fallbackRows[0].id;
        } else {
            // Create a basic 'user' role if not present
            const userRoleId = await insertRole({
                name: 'User',
                slug: 'user',
                description: 'Default user role',
                permissions: ['view_profile','edit_profile'],
                created_by: req.session.user.id,
                tenant_id: role.tenant_id
            });
            fallbackRoleId = userRoleId;
        }

        // Reassign users to fallback role
        await connection.query(
            'UPDATE users SET role_id = ? WHERE role_id = ? AND deleted_at IS NULL',
            [fallbackRoleId, id]
        );

        // Remove role_permissions for this role
        await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [id]);

        // Soft delete the role
        await connection.query('UPDATE roles SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);

        await connection.commit();

        res.json({ success: true, message: 'রোল সফলভাবে ফোর্স ডিলিট করা হয়েছে এবং ইউজারদের পুনঃবন্টন করা হয়েছে' });
    } catch (err) {
        if (connection) {
            try { await connection.rollback(); } catch (e) { console.error('Rollback failed', e); }
        }
        console.error('Force delete role error:', err);
        res.status(500).json({ success: false, message: 'রোল ডিলিট করতে সমস্যা হয়েছে' });
    } finally {
        if (connection) connection.release();
    }
};
// Get a single role by ID
export const getRole = async (req, res) => {
    try {
        const [role] = await db.query(
            'SELECT * FROM roles WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
            [req.params.id, req.session.user.tenant_id]
        );

        if (!role[0]) {
            return res.status(404).json({
                success: false,
                message: 'রোল পাওয়া যায়নি'
            });
        }

        try {
            role[0].permissions = typeof role[0].permissions === 'string'
                ? JSON.parse(role[0].permissions)
                : (role[0].permissions || []);
        } catch (e) {
            console.error('Error parsing role permissions:', e);
            role[0].permissions = [];
        }

        res.json({ success: true, role: role[0] });
    } catch (error) {
        console.error('Error fetching role:', error);
        res.status(500).json({
            success: false,
            message: 'রোল তথ্য লোড করতে সমস্যা হয়েছে'
        });
    }
};

// Create a new role
export const createRole = async (req, res) => {
    console.log('Creating role:', req.body);
    const { name, slug, description, permissions } = req.body;

    // Validate required fields
    if (!name || !slug) {
        return res.status(400).json({
            success: false,
            message: 'নাম এবং স্লাগ পূরণ করুন'
        });
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
        return res.status(400).json({
            success: false,
            message: 'স্লাগে শুধু ছোট হাতের ইংরেজি অক্ষর, সংখ্যা এবং হাইফেন (-) ব্যবহার করা যাবে'
        });
    }

    // Validate permissions
    if (permissions && !validatePermissions(permissions)) {
        return res.status(400).json({
            success: false,
            message: 'অবৈধ পারমিশন'
        });
    }

    try {
        // Check if slug is already in use
        const [existing] = await db.query(
            'SELECT id FROM roles WHERE slug = ? AND tenant_id = ? AND deleted_at IS NULL',
            [slug, req.session.user.tenant_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'এই স্লাগ আগে থেকেই ব্যবহৃত হচ্ছে'
            });
        }

        // Use insertRole model which handles both roles table AND role_permissions sync
        console.log('Creating role with permissions via insertRole model:', permissions);
        const roleId = await insertRole({
            name,
            slug,
            description,
            permissions: permissions || [],
            created_by: req.session.user.id,
            tenant_id: req.session.user.tenant_id
        });

        res.json({
            success: true,
            id: roleId,
            message: 'রোল সফলভাবে তৈরি হয়েছে'
        });
    } catch (error) {
        console.error('Error creating role:', error);
        res.status(500).json({
            success: false,
            message: 'রোল তৈরি করতে সমস্যা হয়েছে'
        });
    }
};

// Update an existing role
export const updateRole = async (req, res) => {
    const { id } = req.params;
    const { name, slug, description, permissions } = req.body;

    // Validate required fields
    if (!name || !slug) {
        return res.status(400).json({
            success: false,
            message: 'নাম এবং স্লাগ পূরণ করুন'
        });
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
        return res.status(400).json({
            success: false,
            message: 'স্লাগে শুধু ছোট হাতের ইংরেজি অক্ষর, সংখ্যা এবং হাইফেন (-) ব্যবহার করা যাবে'
        });
    }

    // Validate permissions
    if (permissions && !validatePermissions(permissions)) {
        return res.status(400).json({
            success: false,
            message: 'অবৈধ পারমিশন'
        });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Check if role exists and belongs to tenant
        const [role] = await connection.query(
            'SELECT id, tenant_id FROM roles WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
            [id, req.session.user.tenant_id]
        );

        if (!role.length) {
            return res.status(404).json({
                success: false,
                message: 'রোল পাওয়া যায়নি'
            });
        }

        // Check if slug is already in use by another role
        const [existing] = await connection.query(
            'SELECT id FROM roles WHERE slug = ? AND id != ? AND tenant_id = ? AND deleted_at IS NULL',
            [slug, id, req.session.user.tenant_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'এই স্লাগ আগে থেকেই ব্যবহৃত হচ্ছে'
            });
        }

        // Update role: explicitly set updated_at so DB always records the update time
        await connection.query(
            'UPDATE roles SET name = ?, slug = ?, description = ?, permissions = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name, slug, description, JSON.stringify(permissions || []), id]
        );

        // Sync permissions to role_permissions table
        if (permissions && permissions.length > 0) {
            console.log('🔍 Syncing permissions for updated role:', permissions);

            // Delete old permissions for this role
            await connection.query(
                'DELETE FROM role_permissions WHERE role_id = ?',
                [id]
            );

            // Ensure permissions exist in permissions_catalog
            const permNames = permissions.map(p => String(p));
            try {
                const catalogValues = permNames.map(p => [p, 'Auto-added permission']);
                await connection.query(
                    'INSERT IGNORE INTO permissions_catalog (name, description) VALUES ?;',
                    [catalogValues]
                );
                console.log('✅ Ensured permissions exist in permissions_catalog');
            } catch (e) {
                console.warn('⚠️ Could not insert into permissions_catalog:', e.message);
            }

            // Get valid permissions from catalog
            const [existingPerms] = await connection.query(
                'SELECT name FROM permissions_catalog WHERE name IN (?)',
                [permNames]
            );

            const validPermissions = existingPerms.map(p => p.name);
            console.log('✅ Valid permissions from catalog:', validPermissions);

            // Insert new permissions
            if (validPermissions.length > 0) {
                const permissionValues = validPermissions.map(p => [id, p, role[0].tenant_id]);
                await connection.query(
                    `INSERT INTO role_permissions (role_id, permission_name, tenant_id) VALUES ?`,
                    [permissionValues]
                );
            }
        } else {
            // Clear permissions if empty
            await connection.query(
                'DELETE FROM role_permissions WHERE role_id = ?',
                [id]
            );
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'রোল সফলভাবে আপডেট হয়েছে'
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Rollback error:', rollbackError);
            }
        }
        console.error('Error updating role:', error);
        res.status(500).json({
            success: false,
            message: 'রোল আপডেট করতে সমস্যা হয়েছে'
        });
    } finally {
        if (connection) connection.release();
    }
};

// Delete a role (soft delete)
export const deleteRole = async (req, res) => {
    const { id } = req.params;

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Check if role exists and belongs to tenant
        const [role] = await connection.query(
            'SELECT id, slug FROM roles WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
            [id, req.session.user.tenant_id]
        );

        if (!role.length) {
            return res.status(404).json({
                success: false,
                message: 'রোল পাওয়া যায়নি'
            });
        }

        // Prevent deletion of essential roles
        if (['owner', 'admin', 'user'].includes(role[0].slug)) {
            return res.status(400).json({
                success: false,
                message: 'এই রোল ডিলিট করা যাবে না'
            });
        }

        // Check if role is assigned to any users
        const [users] = await connection.query(
            'SELECT COUNT(*) as count FROM users WHERE role_id = ? AND deleted_at IS NULL',
            [id]
        );

        if (users[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'এই রোল এখনো কিছু ইউজারের কাছে অ্যাসাইন করা আছে'
            });
        }

        // Soft delete the role
        await connection.query(
            'UPDATE roles SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'রোল সফলভাবে ডিলিট হয়েছে'
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Rollback error:', rollbackError);
            }
        }
        console.error('Error deleting role:', error);
        res.status(500).json({
            success: false,
            message: 'রোল ডিলিট করতে সমস্যা হয়েছে'
        });
    } finally {
        if (connection) connection.release();
    }
};