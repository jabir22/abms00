import express from 'express';
import { authCheck } from '../middlewares/authCheck.js';
import { checkPermission } from '../middlewares/roleCheck.js';
import db from '../config/db.js';
import { generateSystemId } from '../utils/generateSystemId.js';

const router = express.Router();

// Get all payments
router.get('/payments', authCheck, async (req, res) => {
  try {
    const [payments] = await db.query(`
      SELECT p.*, c.name as customer_name, s.name as supplier_name,
             pr.reference_no as payment_ref
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN payment_references pr ON p.reference_id = pr.id
      ORDER BY p.created_at DESC
    `);
    
    res.json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments'
    });
  }
});

// Create payment
router.post('/payments', authCheck, checkPermission('manage_accounts'), async (req, res) => {
  const {
    type,
    customerId,
    supplierId,
    amount,
    method,
    note,
    referenceNo
  } = req.body;

  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Create payment reference
      const [refResult] = await connection.query(
        'INSERT INTO payment_references (reference_no) VALUES (?)',
        [referenceNo || await generateSystemId('PAY')]
      );

      // Create payment
      const [result] = await connection.query(
        `INSERT INTO payments (
          type, customer_id, supplier_id, amount,
          method, note, reference_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [type, customerId, supplierId, amount, method, note, refResult.insertId]
      );

      // Update due amount
      if (type === 'receive' && customerId) {
        await connection.query(
          'UPDATE customers SET due_amount = due_amount - ? WHERE id = ?',
          [amount, customerId]
        );
      } else if (type === 'pay' && supplierId) {
        await connection.query(
          'UPDATE suppliers SET due_amount = due_amount - ? WHERE id = ?',
          [amount, supplierId]
        );
      }

      await connection.commit();

      res.json({
        success: true,
        id: result.insertId,
        message: 'Payment recorded successfully'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording payment'
    });
  }
});

// Get all expenses
router.get('/expenses', authCheck, async (req, res) => {
  try {
    const [expenses] = await db.query(`
      SELECT e.*, c.name as category_name
      FROM expenses e
      LEFT JOIN expense_categories c ON e.category_id = c.id
      ORDER BY e.created_at DESC
    `);
    
    res.json({
      success: true,
      expenses
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expenses'
    });
  }
});

// Create expense
router.post('/expenses', authCheck, checkPermission('manage_accounts'), async (req, res) => {
  const {
    categoryId,
    amount,
    description,
    date
  } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO expenses (category_id, amount, description, date) VALUES (?, ?, ?, ?)',
      [categoryId, amount, description, date]
    );

    res.json({
      success: true,
      id: result.insertId,
      message: 'Expense recorded successfully'
    });
  } catch (error) {
    console.error('Error recording expense:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording expense'
    });
  }
});

// Update expense
router.put('/expenses/:id', authCheck, checkPermission('manage_accounts'), async (req, res) => {
  const {
    categoryId,
    amount,
    description,
    date
  } = req.body;

  try {
    await db.query(
      `UPDATE expenses SET
        category_id = ?, amount = ?, description = ?,
        date = ?, updated_at = NOW()
       WHERE id = ?`,
      [categoryId, amount, description, date, req.params.id]
    );

    res.json({
      success: true,
      message: 'Expense updated successfully'
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating expense'
    });
  }
});

// Delete expense
router.delete('/expenses/:id', authCheck, checkPermission('manage_accounts'), async (req, res) => {
  try {
    await db.query('DELETE FROM expenses WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting expense'
    });
  }
});

// Get expense categories
router.get('/expense-categories', authCheck, async (req, res) => {
  try {
    const [categories] = await db.query(
      'SELECT * FROM expense_categories ORDER BY name'
    );
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expense categories'
    });
  }
});

export default router;