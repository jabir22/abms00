import express from 'express';
import { authCheck } from '../middlewares/authCheck.js';
import { checkPermission } from '../middlewares/roleCheck.js';
import db from '../config/db.js';

const router = express.Router();

// Get all products with category and unit info
router.get('/products', authCheck, async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*, c.name as category_name, u.name as unit_name,
      (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id) as variants_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      ORDER BY p.created_at DESC
    `);
    
    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
});

// Get single product with variants
router.get('/products/:id', authCheck, async (req, res) => {
  try {
    const [product] = await db.query(`
      SELECT p.*, c.name as category_name, u.name as unit_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (!product[0]) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get variants
    const [variants] = await db.query(
      'SELECT * FROM product_variants WHERE product_id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      product: {
        ...product[0],
        variants
      }
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product'
    });
  }
});

// Create product with variants
router.post('/products', authCheck, checkPermission('manage_products'), async (req, res) => {
  const { 
    name,
    code,
    categoryId,
    unitId,
    description,
    variants 
  } = req.body;

  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Create product
      const [result] = await connection.query(
        'INSERT INTO products (name, code, category_id, unit_id, description) VALUES (?, ?, ?, ?, ?)',
        [name, code, categoryId, unitId, description]
      );

      const productId = result.insertId;

      // Create variants if any
      if (variants && variants.length) {
        const variantValues = variants.map(v => [
          productId,
          v.name,
          v.sku,
          v.price,
          v.cost,
          v.quantity || 0
        ]);

        await connection.query(
          'INSERT INTO product_variants (product_id, name, sku, price, cost, quantity) VALUES ?',
          [variantValues]
        );
      }

      await connection.commit();

      res.json({
        success: true,
        id: productId,
        message: 'Product created successfully'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product'
    });
  }
});

// Update product
router.put('/products/:id', authCheck, checkPermission('manage_products'), async (req, res) => {
  const { 
    name,
    code, 
    categoryId,
    unitId,
    description,
    variants
  } = req.body;

  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Update product
      await connection.query(
        `UPDATE products 
         SET name = ?, code = ?, category_id = ?, unit_id = ?, description = ?, 
             updated_at = NOW()
         WHERE id = ?`,
        [name, code, categoryId, unitId, description, req.params.id]
      );

      // Handle variants
      if (variants) {
        // Delete existing variants
        await connection.query(
          'DELETE FROM product_variants WHERE product_id = ?',
          [req.params.id]
        );

        // Create new variants
        if (variants.length) {
          const variantValues = variants.map(v => [
            req.params.id,
            v.name,
            v.sku,
            v.price,
            v.cost,
            v.quantity || 0
          ]);

          await connection.query(
            'INSERT INTO product_variants (product_id, name, sku, price, cost, quantity) VALUES ?',
            [variantValues]
          );
        }
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Product updated successfully'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product'
    });
  }
});

// Delete product
router.delete('/products/:id', authCheck, checkPermission('manage_products'), async (req, res) => {
  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // First check if product exists
      const [product] = await connection.query(
        'SELECT id FROM products WHERE id = ?',
        [req.params.id]
      );

      if (!product.length) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Delete variants first
      await connection.query(
        'DELETE FROM product_variants WHERE product_id = ?',
        [req.params.id]
      );

      // Then delete product
      await connection.query(
        'DELETE FROM products WHERE id = ?',
        [req.params.id]
      );

      await connection.commit();

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product' 
    });
  }
});

// Get product categories
router.get('/categories', authCheck, async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories ORDER BY name');
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

// Get product units
router.get('/units', authCheck, async (req, res) => {
  try {
    const [units] = await db.query('SELECT * FROM units ORDER BY name');
    res.json({
      success: true,
      units
    });
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching units'
    });
  }
});

export default router;