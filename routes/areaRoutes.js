import express from 'express';
import * as areaController from '../controllers/areaController.js';
import { requireLogin } from '../middlewares/authMiddleware.js';
import { checkPermission } from '../middlewares/roleCheck.js';
import logger from '../utils/logger.js';
import Area from '../models/area.model.js';

const router = express.Router();

// ============ MIDDLEWARE ============
// All routes require authentication
router.use(requireLogin);

// ============ VIEW ROUTES ============
// View area list page
router.get('/', (req, res) => {
    if (!req.session?.user) {
        logger.warn('areas.list - unauthenticated attempt to view areas page', { path: req.originalUrl });
    } else {
        logger.info('areas.list - render', { userId: req.session.user.id, role_id: req.session.user.role_id });
    }
    res.render('admin/areas/areas', {
        user: req.session.user,
        title: 'Area Management',
        page: 'areas'
    });
});

// View add area page
router.get('/add', (req, res) => {
    logger.info('areas.add - render', { userId: req.session?.user?.id, role_id: req.session?.user?.role_id });
    res.render('admin/areas/add', {
        user: req.session.user,
        title: 'Add New Area',
        page: 'areas'
    });
});

// View user assignment page
router.get('/assign', (req, res, next) => {
    // log attempt and required permission
    logger.info('areas.assign - attempt to render assign page', { userId: req.session?.user?.id, role_id: req.session?.user?.role_id });
    next();
}, checkPermission('assign_area'), (req, res) => {
    res.render('admin/areas/assign', {
        user: req.session.user,
        title: 'Area User Assignment',
        page: 'areas'
    });
});

// ============ GET ROUTES ============
// Get all areas
router.get('/all', (req, res, next) => {
    logger.info('areas.api.getAll - called', { userId: req.session?.user?.id, role_id: req.session?.user?.role_id });
    next();
}, areaController.getAllAreas);

// DEBUG: return session user, computed filters and a small sample of areas
router.get('/debug', requireLogin, async (req, res) => {
    logger.info('areas.debug - called', { userId: req.session?.user?.id });
    try {
        const user = req.session?.user || null;
        const isOwner = user?.role_slug === 'owner';
        const filters = {};
        if (user && !isOwner && user.tenant_id) filters.tenant_id = user.tenant_id;

        const areas = await Area.getAll(filters);

        return res.status(200).json({
            success: true,
            user,
            filters,
            areasCount: areas.length,
            areasSample: areas.slice(0, 10)
        });
    } catch (error) {
        logger.info('areas.debug - error', { error: error.message });
        return res.status(500).json({ success: false, message: error.message });
    }
});
// The template file is `views/admin/areas/areas.ejs` in this repo
// Get area by ID
router.get('/:id', areaController.getAreaById);

// Get all areas for a specific user
router.get('/user/:userId', areaController.getUserAreas);

// Get all users in a specific area
router.get('/area/:areaId/users', areaController.getAreaUsers);

// ============ POST ROUTES ============
// Create new area (requires admin or area_manager role)
router.post(
    '/create',
    (req, res, next) => {
        logger.info('areas.api.create - attempt', { userId: req.session?.user?.id, role_id: req.session?.user?.role_id });
        next();
    },
    checkPermission('create_area'),
    areaController.createArea
);

// Assign user to area (requires assign_area permission)
router.post('/assign-user', (req, res, next) => {
    logger.info('areas.api.assignUser - attempt', { userId: req.session?.user?.id, role_id: req.session?.user?.role_id, body: req.body });
    next();
}, checkPermission('assign_area'), areaController.assignUserToArea);

// Remove user from area (requires assign_area permission)
router.post('/remove-user', (req, res, next) => {
    logger.info('areas.api.removeUser - attempt', { userId: req.session?.user?.id, role_id: req.session?.user?.role_id, body: req.body });
    next();
}, checkPermission('assign_area'), areaController.removeUserFromArea);

// ============ PUT ROUTES ============
// Update area (requires admin or area_manager role)
router.put(
    '/:id',
    (req, res, next) => {
        logger.info('areas.api.update - attempt', { userId: req.session?.user?.id, role_id: req.session?.user?.role_id, params: req.params });
        next();
    },
    checkPermission('update_area'),
    areaController.updateArea
);

// ============ DELETE ROUTES ============
// Delete area (requires admin role)
router.delete(
    '/:id',
    (req, res, next) => {
        logger.info('areas.api.delete - attempt', { userId: req.session?.user?.id, role_id: req.session?.user?.role_id, params: req.params });
        next();
    },
    checkPermission('delete_area'),
    areaController.deleteArea
);

export default router;
