import express from 'express';
import { authCheck } from '../middlewares/authCheck.js';
import { checkPermission } from '../middlewares/roleCheck.js';
import db from '../config/db.js';
import { generateSystemId } from '../utils/generateSystemId.js';

const router = express.Router();

// Get all sales with customer info
router.get('/sales', authCheck, async (req, res) => {
  try {
    const [sales] = await db.query(`
      SELECT s.*, c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.created_at DESC
    `);
    
    res.json({
      success: true,
      sales
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales'
    });
  }
});

// Get single sale with items
router.get('/sales/:id', authCheck, async (req, res) => {
  try {
    // Get sale info
    const [sale] = await db.query(`
      SELECT s.*, c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.id = ?
    `, [req.params.id]);

    if (!sale[0]) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    // Get sale items
    const [items] = await db.query(`
      SELECT si.*, p.name as product_name, pv.name as variant_name,
             u.name as unit_name
      FROM sale_items si
      LEFT JOIN products p ON si.product_id = p.id
      LEFT JOIN product_variants pv ON si.variant_id = pv.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE si.sale_id = ?
    `, [req.params.id]);

    res.json({
      success: true,
      sale: {
        ...sale[0],
        items
      }
    });
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sale'
    });
  }
});

// Create sale
router.post('/sales', authCheck, checkPermission('manage_sales'), async (req, res) => {
  const {
    customerId,
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
      // Generate invoice number
      const invoiceNo = await generateSystemId('SALE');

      // Create sale
      const [result] = await connection.query(
        `INSERT INTO sales (
          invoice_no, customer_id, total_amount, discount,
          paid_amount, note
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [invoiceNo, customerId, total, discount, paid, note]
      );

      const saleId = result.insertId;

      // Create sale items
      const itemValues = items.map(item => [
        saleId,
        item.productId,
        item.variantId,
        item.quantity,
        item.price,
        item.total
      ]);

      await connection.query(
        `INSERT INTO sale_items (
          sale_id, product_id, variant_id,
          quantity, price, total
        ) VALUES ?`,
        [itemValues]
      );

      // Update stock
      for (const item of items) {
        await connection.query(
          'UPDATE product_variants SET quantity = quantity - ? WHERE id = ?',
          [item.quantity, item.variantId]
        );
      }

      await connection.commit();

      res.json({
        success: true,
        id: saleId,
        invoiceNo,
        message: 'Sale created successfully'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating sale'
    });
  }
});

// Update sale
router.put('/sales/:id', authCheck, checkPermission('manage_sales'), async (req, res) => {
  const {
    customerId,
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
      // First get original sale items to restore stock
      const [oldItems] = await connection.query(
        'SELECT variant_id, quantity FROM sale_items WHERE sale_id = ?',
        [req.params.id]
      );

      // Restore stock for old items
      for (const item of oldItems) {
        await connection.query(
          'UPDATE product_variants SET quantity = quantity + ? WHERE id = ?',
          [item.quantity, item.variant_id]
        );
      }

      // Update sale
      await connection.query(
        `UPDATE sales SET
          customer_id = ?, total_amount = ?, discount = ?,
          paid_amount = ?, note = ?, updated_at = NOW()
         WHERE id = ?`,
        [customerId, total, discount, paid, note, req.params.id]
      );

      // Delete old items
      await connection.query(
        'DELETE FROM sale_items WHERE sale_id = ?',
        [req.params.id]
      );

      // Create new items
      const itemValues = items.map(item => [
        req.params.id,
        item.productId,
        item.variantId,
        item.quantity,
        item.price,
        item.total
      ]);

      await connection.query(
        `INSERT INTO sale_items (
          sale_id, product_id, variant_id,
          quantity, price, total
        ) VALUES ?`,
        [itemValues]
      );

      // Update stock for new items
      for (const item of items) {
        await connection.query(
          'UPDATE product_variants SET quantity = quantity - ? WHERE id = ?',
          [item.quantity, item.variantId]
        );
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Sale updated successfully'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating sale:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating sale'
    });
  }
});

// Delete sale
router.delete('/sales/:id', authCheck, checkPermission('manage_sales'), async (req, res) => {
  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // First get sale items to restore stock
      const [items] = await connection.query(
        'SELECT variant_id, quantity FROM sale_items WHERE sale_id = ?',
        [req.params.id]
      );

      // Restore stock
      for (const item of items) {
        await connection.query(
          'UPDATE product_variants SET quantity = quantity + ? WHERE id = ?',
          [item.quantity, item.variant_id]
        );
      }

      // Delete sale items
      await connection.query(
        'DELETE FROM sale_items WHERE sale_id = ?',
        [req.params.id]
      );

      // Delete sale
      await connection.query(
        'DELETE FROM sales WHERE id = ?',
        [req.params.id]
      );

      await connection.commit();

      res.json({
        success: true,
        message: 'Sale deleted successfully'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting sale'
    });
  }
});

export default router;