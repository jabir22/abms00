import express from 'express';
import { authCheck } from '../middlewares/authCheck.js';
import { checkPermission } from '../middlewares/roleCheck.js';
import db from '../config/db.js';
import { generateSystemId } from '../utils/generateSystemId.js';

const router = express.Router();

// Get all purchases with supplier info
router.get('/purchases', authCheck, async (req, res) => {
  try {
    const [purchases] = await db.query(`
      SELECT p.*, s.name as supplier_name
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.created_at DESC
    `);
    
    res.json({
      success: true,
      purchases
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchases'
    });
  }
});

// Get single purchase with items
router.get('/purchases/:id', authCheck, async (req, res) => {
  try {
    // Get purchase info
    const [purchase] = await db.query(`
      SELECT p.*, s.name as supplier_name
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (!purchase[0]) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    // Get purchase items
    const [items] = await db.query(`
      SELECT pi.*, p.name as product_name, pv.name as variant_name,
             u.name as unit_name
      FROM purchase_items pi
      LEFT JOIN products p ON pi.product_id = p.id
      LEFT JOIN product_variants pv ON pi.variant_id = pv.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE pi.purchase_id = ?
    `, [req.params.id]);

    res.json({
      success: true,
      purchase: {
        ...purchase[0],
        items
      }
    });
  } catch (error) {
    console.error('Error fetching purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase'
    });
  }
});

// Create purchase
router.post('/purchases', authCheck, checkPermission('manage_purchases'), async (req, res) => {
  const {
    supplierId,
    items,
    total,
    discount,
    paid,
    note
  } = req.body;

  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Generate reference number
      const refNo = await generateSystemId('PUR');

      // Create purchase
      const [result] = await connection.query(
        `INSERT INTO purchases (
          reference_no, supplier_id, total_amount, discount,
          paid_amount, note
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [refNo, supplierId, total, discount, paid, note]
      );

      const purchaseId = result.insertId;

      // Create purchase items
      const itemValues = items.map(item => [
        purchaseId,
        item.productId,
        item.variantId,
        item.quantity,
        item.cost,
        item.total
      ]);

      await connection.query(
        `INSERT INTO purchase_items (
          purchase_id, product_id, variant_id,
          quantity, cost, total
        ) VALUES ?`,
        [itemValues]
      );

      // Update stock
      for (const item of items) {
        await connection.query(
          'UPDATE product_variants SET quantity = quantity + ? WHERE id = ?',
          [item.quantity, item.variantId]
        );
      }

      await connection.commit();

      res.json({
        success: true,
        id: purchaseId,
        refNo,
        message: 'Purchase created successfully'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating purchase'
    });
  }
});

// Update purchase
router.put('/purchases/:id', authCheck, checkPermission('manage_purchases'), async (req, res) => {
  const {
    supplierId,
    items,
    total,
    discount,
    paid,
    note
  } = req.body;

  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // First get original purchase items to update stock
      const [oldItems] = await connection.query(
        'SELECT variant_id, quantity FROM purchase_items WHERE purchase_id = ?',
        [req.params.id]
      );

      // Restore stock for old items
      for (const item of oldItems) {
        await connection.query(
          'UPDATE product_variants SET quantity = quantity - ? WHERE id = ?',
          [item.quantity, item.variant_id]
        );
      }

      // Update purchase
      await connection.query(
        `UPDATE purchases SET
          supplier_id = ?, total_amount = ?, discount = ?,
          paid_amount = ?, note = ?, updated_at = NOW()
         WHERE id = ?`,
        [supplierId, total, discount, paid, note, req.params.id]
      );

      // Delete old items
      await connection.query(
        'DELETE FROM purchase_items WHERE purchase_id = ?',
        [req.params.id]
      );

      // Create new items
      const itemValues = items.map(item => [
        req.params.id,
        item.productId,
        item.variantId,
        item.quantity,
        item.cost,
        item.total
      ]);

      await connection.query(
        `INSERT INTO purchase_items (
          purchase_id, product_id, variant_id,
          quantity, cost, total
        ) VALUES ?`,
        [itemValues]
      );

      // Update stock for new items
      for (const item of items) {
        await connection.query(
          'UPDATE product_variants SET quantity = quantity + ? WHERE id = ?',
          [item.quantity, item.variantId]
        );
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Purchase updated successfully'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating purchase'
    });
  }
});

// Delete purchase
router.delete('/purchases/:id', authCheck, checkPermission('manage_purchases'), async (req, res) => {
  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // First get purchase items to update stock
      const [items] = await connection.query(
        'SELECT variant_id, quantity FROM purchase_items WHERE purchase_id = ?',
        [req.params.id]
      );

      // Update stock
      for (const item of items) {
        await connection.query(
          'UPDATE product_variants SET quantity = quantity - ? WHERE id = ?',
          [item.quantity, item.variant_id]
        );
      }

      // Delete purchase items
      await connection.query(
        'DELETE FROM purchase_items WHERE purchase_id = ?',
        [req.params.id]
      );

      // Delete purchase
      await connection.query(
        'DELETE FROM purchases WHERE id = ?',
        [req.params.id]
      );

      await connection.commit();

      res.json({
        success: true,
        message: 'Purchase deleted successfully'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting purchase'
    });
  }
});

export default router;