import db from '../config/db.js';

class Area {
    // ============ CREATE ============
    static async create(data) {
        try {
            const { name_bn, name_en, description_bn, description_en, code, region, parent_id, created_by } = data;

            // accept tenant_id if provided in data
            const tenant_id = data.tenant_id !== undefined ? data.tenant_id : null;

            const query = `
        INSERT INTO areas (name_bn, name_en, description_bn, description_en, code, region, parent_id, created_by, tenant_id, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `;

            const [result] = await db.execute(query, [
                name_bn, name_en, description_bn, description_en, code, region, parent_id || null, created_by, tenant_id
            ]);

            return { id: result.insertId, ...data };
        } catch (error) {
            throw new Error(`Area creation error: ${error.message}`);
        }
    }

    // ============ READ ============
    static async getById(id) {
        try {
            const query = `
             SELECT a.*, 
                 COALESCE(u_created.name_en, JSON_UNQUOTE(JSON_EXTRACT(u_created.meta, '$.name')), '') as created_by_name,
                 COALESCE(u_updated.name_en, JSON_UNQUOTE(JSON_EXTRACT(u_updated.meta, '$.name')), '') as updated_by_name,
                 parent.name_bn as parent_name_bn,
                 parent.name_en as parent_name_en
             FROM areas a
             LEFT JOIN users u_created ON a.created_by = u_created.id
             LEFT JOIN users u_updated ON a.updated_by = u_updated.id
             LEFT JOIN areas parent ON a.parent_id = parent.id
             WHERE a.id = ?
              `;

            const [rows] = await db.execute(query, [id]);
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Area fetch error: ${error.message}`);
        }
    }

    static async getAll(filters = {}) {
        try {
            let query = `
             SELECT a.*, 
                 COALESCE(u_created.name_en, JSON_UNQUOTE(JSON_EXTRACT(u_created.meta, '$.name')), '') as created_by_name,
                 COUNT(DISTINCT ua.user_id) as user_count,
                 COUNT(DISTINCT ap.id) as permission_count
             FROM areas a
             LEFT JOIN users u_created ON a.created_by = u_created.id
             LEFT JOIN user_areas ua ON a.id = ua.area_id
             LEFT JOIN area_permissions ap ON a.id = ap.area_id
             WHERE 1=1
              `;

            const params = [];

            if (filters.is_active !== undefined) {
                query += ` AND a.is_active = ?`;
                params.push(filters.is_active);
            }

            if (filters.region) {
                query += ` AND a.region LIKE ?`;
                params.push(`%${filters.region}%`);
            }

            if (filters.search) {
                query += ` AND (a.name_bn LIKE ? OR a.name_en LIKE ? OR a.code LIKE ?)`;
                params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
            }

            // Apply tenant filter when provided (prevents cross-tenant visibility)
            if (filters.tenant_id) {
                query += ` AND a.tenant_id = ?`;
                params.push(filters.tenant_id);
            }

            query += ` GROUP BY a.id ORDER BY a.name_bn ASC`;

            const [rows] = await db.execute(query, params);
            return rows;
        } catch (error) {
            throw new Error(`Area fetch error: ${error.message}`);
        }
    }

    static async getByCode(code, tenantId = null) {
        try {
            let query;
            let params = [code];
            if (tenantId) {
                query = `SELECT * FROM areas WHERE code = ? AND tenant_id = ? LIMIT 1`;
                params.push(tenantId);
            } else {
                query = `SELECT * FROM areas WHERE code = ? LIMIT 1`;
            }

            const [rows] = await db.execute(query, params);
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Area fetch error: ${error.message}`);
        }
    }

    // ============ UPDATE ============
    static async update(id, data) {
        try {
            const { name_bn, name_en, description_bn, description_en, code, region, parent_id, is_active, updated_by } = data;

            const query = `
        UPDATE areas 
        SET name_bn = ?, name_en = ?, description_bn = ?, description_en = ?, 
            code = ?, region = ?, parent_id = ?, is_active = ?, updated_by = ?
        WHERE id = ?
      `;

            const [result] = await db.execute(query, [
                name_bn, name_en, description_bn, description_en, code, region,
                parent_id || null, is_active, updated_by, id
            ]);

            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Area update error: ${error.message}`);
        }
    }

    // ============ DELETE ============
    static async delete(id) {
        try {
            const query = `DELETE FROM areas WHERE id = ?`;
            const [result] = await db.execute(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Area deletion error: ${error.message}`);
        }
    }

    // ============ USER AREA MANAGEMENT ============
    static async assignUserToArea(userId, areaId, assignedBy) {
        try {
            const query = `
        INSERT INTO user_areas (user_id, area_id, assigned_by)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP
      `;

            const [result] = await db.execute(query, [userId, areaId, assignedBy]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`User-area assignment error: ${error.message}`);
        }
    }

    static async removeUserFromArea(userId, areaId) {
        try {
            const query = `DELETE FROM user_areas WHERE user_id = ? AND area_id = ?`;
            const [result] = await db.execute(query, [userId, areaId]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`User-area removal error: ${error.message}`);
        }
    }

    static async getUserAreas(userId) {
        try {
            const query = `
                         SELECT a.*, ua.assigned_at, ua.assigned_by,
                             COALESCE(u_assigned.name_en, JSON_UNQUOTE(JSON_EXTRACT(u_assigned.meta, '$.name')), '') as assigned_by_name,
                             parent.name_bn as parent_name_bn, parent.name_en as parent_name_en
                         FROM areas a
                         INNER JOIN user_areas ua ON a.id = ua.area_id
                         LEFT JOIN users u_assigned ON ua.assigned_by = u_assigned.id
                         LEFT JOIN areas parent ON a.parent_id = parent.id
                         WHERE ua.user_id = ? AND a.is_active = 1
                         ORDER BY a.name_bn ASC
                          `;

            const [rows] = await db.execute(query, [userId]);
            return rows;
        } catch (error) {
            throw new Error(`User areas fetch error: ${error.message}`);
        }
    }

    static async getAreaUsers(areaId) {
        try {
            const query = `
                SELECT u.*, ua.assigned_at, COALESCE(u.name_en, JSON_UNQUOTE(JSON_EXTRACT(u.meta, '$.name')), '') as name
                FROM users u
                INNER JOIN user_areas ua ON u.id = ua.user_id
                WHERE ua.area_id = ?
                ORDER BY name ASC
            `;

            const [rows] = await db.execute(query, [areaId]);
            return rows;
        } catch (error) {
            throw new Error(`Area users fetch error: ${error.message}`);
        }
    }

    // ============ PERMISSION MANAGEMENT ============
    static async setPermission(areaId, roleId, permissionName, permissions) {
        try {
            const { can_create, can_read, can_update, can_delete } = permissions;

            const query = `
        INSERT INTO area_permissions (area_id, role_id, permission_name, can_create, can_read, can_update, can_delete)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          can_create = ?, can_read = ?, can_update = ?, can_delete = ?
      `;

            const [result] = await db.execute(query, [
                areaId, roleId, permissionName, can_create, can_read, can_update, can_delete,
                can_create, can_read, can_update, can_delete
            ]);

            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Permission setting error: ${error.message}`);
        }
    }

    static async getPermissions(areaId, roleId = null) {
        try {
            let query = `SELECT * FROM area_permissions WHERE area_id = ?`;
            const params = [areaId];

            if (roleId) {
                query += ` AND role_id = ?`;
                params.push(roleId);
            }

            const [rows] = await db.execute(query, params);
            return rows;
        } catch (error) {
            throw new Error(`Permissions fetch error: ${error.message}`);
        }
    }

    static async hasPermission(userId, areaId, action) {
        try {
            const query = `
        SELECT ap.* FROM area_permissions ap
        INNER JOIN user_roles ur ON ap.role_id = ur.role_id
        WHERE ur.user_id = ? AND ap.area_id = ?
      `;

            const [permissions] = await db.execute(query, [userId, areaId]);

            if (!permissions.length) return false;

            // Check if any role has the required permission
            return permissions.some(p => {
                switch (action) {
                    case 'create': return p.can_create;
                    case 'read': return p.can_read;
                    case 'update': return p.can_update;
                    case 'delete': return p.can_delete;
                    default: return false;
                }
            });
        } catch (error) {
            throw new Error(`Permission check error: ${error.message}`);
        }
    }
}

export default Area;
