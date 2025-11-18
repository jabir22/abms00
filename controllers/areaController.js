import Area from '../models/area.model.js';
import logger from '../utils/logger.js';

// ============ GET ALL AREAS ============
export const getAllAreas = async (req, res) => {
    logger.info('getAllAreas - start', { userId: req.user?.id, query: req.query });
    try {
        const { search, region, active } = req.query;

        const filters = {
            search: search || null,
            region: region || null,
            is_active: active !== undefined ? (active === 'true' ? 1 : 0) : 1
        };

        // Tenant scoping: non-owner users should only see areas belonging to their tenant
        const isOwner = req.user?.role_slug === 'owner';
        if (req.user && !isOwner && req.user.tenant_id) {
            filters.tenant_id = req.user.tenant_id;
        }

        // Debug: log filters and user info to help diagnose empty results
        logger.info('getAllAreas - filters', { filters, user: req.user });

        const areas = await Area.getAll(filters);

        logger.info(`User ${req.user?.id || 'anonymous'} fetched ${areas.length} areas`);

        res.status(200).json({
            success: true,
            message: 'Areas retrieved successfully',
            data: areas,
            count: areas.length
        });
    } catch (error) {
        logger.info(`Area fetch error: ${error.message}`, { error, user: req.user?.id, query: req.query });
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch areas'
        });
    }
};

// ============ GET AREA BY ID ============
export const getAreaById = async (req, res) => {
    logger.info('getAreaById - start', { userId: req.user?.id, params: req.params });
    try {
        const { id } = req.params;

        const area = await Area.getById(id);

        if (!area) {
            logger.warn('getAreaById - area not found', { areaId: id, userId: req.user?.id });
            return res.status(404).json({
                success: false,
                message: 'Area not found'
            });
        }

        // Get users assigned to this area
        const users = await Area.getAreaUsers(id);

        // Get permissions for this area
        const permissions = await Area.getPermissions(id);

        logger.info(`User ${req.user.id} viewed area ${id}`);

        res.status(200).json({
            success: true,
            message: 'Area retrieved successfully',
            data: {
                ...area,
                users,
                permissions
            }
        });
    } catch (error) {
        logger.info(`Area fetch error: ${error.message}`, { error, user: req.user?.id, params: req.params });
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch area'
        });
    }
};

// ============ CREATE AREA ============
export const createArea = async (req, res) => {
    logger.info('createArea - start', { userId: req.user?.id, body: req.body });
    try {
        const { name_bn, name_en, description_bn, description_en, code, region, parent_id } = req.body;

        // Validate required fields
        if (!name_bn || !name_en || !code) {
            logger.warn('createArea - validation failed', { body: req.body, userId: req.user?.id });
            return res.status(400).json({
                success: false,
                message: 'Required fields missing: name_bn, name_en, code'
            });
        }

        // Check if code already exists
        const existingArea = await Area.getByCode(code);
        if (existingArea) {
            logger.warn('createArea - duplicate area code', { code, existingAreaId: existingArea.id, userId: req.user?.id });
            return res.status(409).json({
                success: false,
                message: 'Area code already exists'
            });
        }

        const areaData = {
            name_bn,
            name_en,
            description_bn: description_bn || '',
            description_en: description_en || '',
            code,
            region: region || '',
            parent_id: parent_id || null,
            created_by: req.user.id,
            tenant_id: req.user?.tenant_id || null
        };

        const newArea = await Area.create(areaData);

        logger.info(`User ${req.user.id} created area: ${name_en} (${code})`);

        res.status(201).json({
            success: true,
            message: 'Area created successfully',
            data: newArea
        });
    } catch (error) {
        logger.info(`Area creation error: ${error.message}`, { error, user: req.user?.id, body: req.body });
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create area'
        });
    }
};

// ============ UPDATE AREA ============
export const updateArea = async (req, res) => {
    logger.info('updateArea - start', { userId: req.user?.id, params: req.params, body: req.body });
    try {
        const { id } = req.params;
        const { name_bn, name_en, description_bn, description_en, code, region, parent_id, is_active } = req.body;

        // Check if area exists
        const area = await Area.getById(id);
        if (!area) {
            logger.warn('updateArea - area not found', { areaId: id, userId: req.user?.id });
            return res.status(404).json({
                success: false,
                message: 'Area not found'
            });
        }

        // Check if code already exists (for other areas)
        if (code && code !== area.code) {
            const existingArea = await Area.getByCode(code, req.user?.tenant_id || null);
            if (existingArea) {
                logger.warn('updateArea - code conflict', { areaId: id, newCode: code, conflictingAreaId: existingArea.id, userId: req.user?.id });
                return res.status(409).json({
                    success: false,
                    message: 'Area code already exists'
                });
            }
        }

        const updateData = {
            name_bn: name_bn || area.name_bn,
            name_en: name_en || area.name_en,
            description_bn: description_bn !== undefined ? description_bn : area.description_bn,
            description_en: description_en !== undefined ? description_en : area.description_en,
            code: code || area.code,
            region: region !== undefined ? region : area.region,
            parent_id: parent_id !== undefined ? parent_id : area.parent_id,
            is_active: is_active !== undefined ? is_active : area.is_active,
            updated_by: req.user.id
        };

        const success = await Area.update(id, updateData);

        if (success) {
            logger.info(`User ${req.user.id} updated area ${id}`);

            const updatedArea = await Area.getById(id);

            res.status(200).json({
                success: true,
                message: 'Area updated successfully',
                data: updatedArea
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to update area'
            });
        }
    } catch (error) {
        logger.info(`Area update error: ${error.message}`, { error, user: req.user?.id, params: req.params, body: req.body });
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update area'
        });
    }
};

// ============ DELETE AREA ============
export const deleteArea = async (req, res) => {
    logger.info('deleteArea - start', { userId: req.user?.id, params: req.params });
    try {
        const { id } = req.params;

        // Check if area exists
        const area = await Area.getById(id);
        if (!area) {
            logger.warn('deleteArea - area not found', { areaId: id, userId: req.user?.id });
            return res.status(404).json({
                success: false,
                message: 'Area not found'
            });
        }

        const success = await Area.delete(id);

        if (success) {
            logger.info(`User ${req.user.id} deleted area ${id}`);

            res.status(200).json({
                success: true,
                message: 'Area deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to delete area'
            });
        }
    } catch (error) {
        logger.info(`Area deletion error: ${error.message}`, { error, user: req.user?.id, params: req.params });
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete area'
        });
    }
};

// ============ ASSIGN USER TO AREA ============
export const assignUserToArea = async (req, res) => {
    logger.info('assignUserToArea - start', { userId: req.user?.id, body: req.body });
    try {
        const { areaId, userId } = req.body;

        if (!areaId || !userId) {
            logger.warn('assignUserToArea - missing parameters', { body: req.body, userId: req.user?.id });
            return res.status(400).json({
                success: false,
                message: 'Area ID and User ID required'
            });
        }

        // Check if area exists
        const area = await Area.getById(areaId);
        if (!area) {
            logger.warn('assignUserToArea - area not found', { areaId, userId: req.user?.id });
            return res.status(404).json({
                success: false,
                message: 'Area not found'
            });
        }

        const success = await Area.assignUserToArea(userId, areaId, req.user.id);

        if (success) {
            logger.info(`User ${req.user.id} assigned user ${userId} to area ${areaId}`);

            res.status(200).json({
                success: true,
                message: 'User assigned to area successfully'
            });
        } else {
            logger.warn('assignUserToArea - assignment failed', { areaId, userId, by: req.user?.id });
            res.status(500).json({
                success: false,
                message: 'Failed to assign user to area'
            });
        }
    } catch (error) {
        logger.info(`User-area assignment error: ${error.message}`, { error, user: req.user?.id, body: req.body });
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to assign user to area'
        });
    }
};

// ============ REMOVE USER FROM AREA ============
export const removeUserFromArea = async (req, res) => {
    logger.info('removeUserFromArea - start', { userId: req.user?.id, body: req.body });
    try {
        const { areaId, userId } = req.body;

        if (!areaId || !userId) {
            logger.warn('removeUserFromArea - missing parameters', { body: req.body, userId: req.user?.id });
            return res.status(400).json({
                success: false,
                message: 'Area ID and User ID required'
            });
        }

        const success = await Area.removeUserFromArea(userId, areaId);

        if (success) {
            logger.info(`User ${req.user.id} removed user ${userId} from area ${areaId}`);

            res.status(200).json({
                success: true,
                message: 'User removed from area successfully'
            });
        } else {
            logger.warn('removeUserFromArea - removal failed', { areaId, userId, by: req.user?.id });
            res.status(500).json({
                success: false,
                message: 'Failed to remove user from area'
            });
        }
    } catch (error) {
        logger.info(`User-area removal error: ${error.message}`, { error, user: req.user?.id, body: req.body });
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to remove user from area'
        });
    }
};

// ============ GET USER AREAS ============
export const getUserAreas = async (req, res) => {
    logger.info('getUserAreas - start', { userId: req.user?.id, params: req.params });
    try {
        const { userId } = req.params;

        const areas = await Area.getUserAreas(userId);

        logger.info(`Fetched ${areas.length} areas for user ${userId}`);

        res.status(200).json({
            success: true,
            message: 'User areas retrieved successfully',
            data: areas,
            count: areas.length
        });
    } catch (error) {
        logger.info(`User areas fetch error: ${error.message}`, { error, user: req.user?.id, params: req.params });
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch user areas'
        });
    }
};

// ============ GET AREA USERS ============
export const getAreaUsers = async (req, res) => {
    logger.info('getAreaUsers - start', { userId: req.user?.id, params: req.params });
    try {
        const { areaId } = req.params;

        // Check if area exists
        const area = await Area.getById(areaId);
        if (!area) {
            return res.status(404).json({
                success: false,
                message: 'Area not found'
            });
        }

        const users = await Area.getAreaUsers(areaId);

        logger.info(`Fetched ${users.length} users for area ${areaId}`);

        res.status(200).json({
            success: true,
            message: 'Area users retrieved successfully',
            data: users,
            count: users.length
        });
    } catch (error) {
        logger.info(`Area users fetch error: ${error.message}`, { error, user: req.user?.id, params: req.params });
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch area users'
        });
    }
};
