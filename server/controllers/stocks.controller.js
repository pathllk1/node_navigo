/**
 * Stocks Controller
 * Handles inventory/stock item management operations
 */

import { db } from '../utils/db.js';

/**
 * Get all stocks for a firm
 */
export async function getAllStocks(req, res) {
  try {
    const { firm_id, role } = req.user;
    
    if (!firm_id && role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. No firm assigned.' });
    }

    const { 
      category,
      status = 'Active', 
      page = 1, 
      limit = 50,
      sortBy = 'item_name',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (page - 1) * limit;
    
    let query = `
      SELECT s.*,
             CASE 
               WHEN s.current_stock <= s.min_stock THEN 'LOW'
               WHEN s.current_stock >= s.max_stock THEN 'HIGH'
               ELSE 'NORMAL'
             END as stock_status,
             (s.current_stock * s.purchase_rate) as stock_value
      FROM stocks s
      WHERE s.firm_id = ?
    `;
    
    const params = [firm_id];
    
    if (category) {
      query += ` AND s.category = ?`;
      params.push(category);
    }
    
    if (status !== 'ALL') {
      query += ` AND s.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY ${sortBy} ${sortOrder}`;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    
    const stocks = db.prepare(query).all(...params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM stocks WHERE firm_id = ?`;
    const countParams = [firm_id];
    
    if (category) {
      countQuery += ` AND category = ?`;
      countParams.push(category);
    }
    
    if (status !== 'ALL') {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }
    
    const { total } = db.prepare(countQuery).get(...countParams);
    
    res.json({
      stocks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({ error: 'Failed to fetch stocks' });
  }
}

/**
 * Get stock by ID
 */
export async function getStockById(req, res) {
  try {
    const { firm_id, role } = req.user;
    const { id } = req.params;
    
    if (!firm_id && role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. No firm assigned.' });
    }

    const stock = db.prepare(`
      SELECT s.*,
             CASE 
               WHEN s.current_stock <= s.min_stock THEN 'LOW'
               WHEN s.current_stock >= s.max_stock THEN 'HIGH'
               ELSE 'NORMAL'
             END as stock_status,
             (s.current_stock * s.purchase_rate) as stock_value
      FROM stocks s
      WHERE s.id = ? AND s.firm_id = ?
    `).get(id, firm_id);
    
    if (!stock) {
      return res.status(404).json({ error: 'Stock item not found' });
    }
    
    res.json(stock);
    
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ error: 'Failed to fetch stock' });
  }
}

/**
 * Create new stock item
 */
export async function createStock(req, res) {
  try {
    const { firm_id, id: user_id, role } = req.user;
    
    if (!firm_id && role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. No firm assigned.' });
    }

    const {
      item_name,
      item_code,
      hsn_code,
      unit = 'PCS',
      category,
      opening_stock = 0,
      min_stock = 0,
      max_stock = 0,
      purchase_rate = 0,
      sale_rate = 0,
      gst_rate = 0,
      cess_rate = 0,
      description
    } = req.body;

    // Validation
    if (!item_name) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    // Check for duplicate item code
    if (item_code) {
      const existing = db.prepare(`
        SELECT id FROM stocks WHERE firm_id = ? AND item_code = ?
      `).get(firm_id, item_code);
      
      if (existing) {
        return res.status(400).json({ error: 'Item code already exists' });
      }
    }

    // Insert stock item
    const result = db.transaction(() => {
      const stockResult = db.prepare(`
        INSERT INTO stocks (
          firm_id, item_name, item_code, hsn_code, unit, category,
          opening_stock, current_stock, min_stock, max_stock,
          purchase_rate, sale_rate, gst_rate, cess_rate, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        firm_id, item_name, item_code, hsn_code, unit, category,
        opening_stock, opening_stock, min_stock, max_stock,
        purchase_rate, sale_rate, gst_rate, cess_rate, description
      );

      const stockId = stockResult.lastInsertRowid;

      // Create opening stock entry in register if opening_stock > 0
      if (opening_stock > 0) {
        db.prepare(`
          INSERT INTO stock_reg (
            firm_id, stock_id, ref_type, movement_date, movement_type,
            qty, rate, amount, balance_qty, remarks
          ) VALUES (?, ?, 'OPENING', date('now'), 'IN', ?, ?, ?, ?, 'Opening Stock')
        `).run(
          firm_id, stockId, opening_stock, purchase_rate,
          opening_stock * purchase_rate, opening_stock
        );
      }

      return stockId;
    })();

    res.status(201).json({
      message: 'Stock item created successfully',
      stockId: result
    });

  } catch (error) {
    console.error('Error creating stock:', error);
    res.status(500).json({ error: 'Failed to create stock item' });
  }
}

/**
 * Update stock item
 */
export async function updateStock(req, res) {
  try {
    const { firm_id, role } = req.user;
    const { id } = req.params;
    
    if (!firm_id && role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. No firm assigned.' });
    }

    const {
      item_name,
      item_code,
      hsn_code,
      unit,
      category,
      min_stock,
      max_stock,
      purchase_rate,
      sale_rate,
      gst_rate,
      cess_rate,
      description,
      status
    } = req.body;

    // Check if stock exists
    const existing = db.prepare(`
      SELECT id FROM stocks WHERE id = ? AND firm_id = ?
    `).get(id, firm_id);
    
    if (!existing) {
      return res.status(404).json({ error: 'Stock item not found' });
    }

    // Check for duplicate item code
    if (item_code) {
      const duplicate = db.prepare(`
        SELECT id FROM stocks WHERE firm_id = ? AND item_code = ? AND id != ?
      `).get(firm_id, item_code, id);
      
      if (duplicate) {
        return res.status(400).json({ error: 'Item code already exists' });
      }
    }

    // Update stock
    db.prepare(`
      UPDATE stocks SET
        item_name = COALESCE(?, item_name),
        item_code = COALESCE(?, item_code),
        hsn_code = COALESCE(?, hsn_code),
        unit = COALESCE(?, unit),
        category = COALESCE(?, category),
        min_stock = COALESCE(?, min_stock),
        max_stock = COALESCE(?, max_stock),
        purchase_rate = COALESCE(?, purchase_rate),
        sale_rate = COALESCE(?, sale_rate),
        gst_rate = COALESCE(?, gst_rate),
        cess_rate = COALESCE(?, cess_rate),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        updated_at = datetime('now')
      WHERE id = ? AND firm_id = ?
    `).run(
      item_name, item_code, hsn_code, unit, category,
      min_stock, max_stock, purchase_rate, sale_rate,
      gst_rate, cess_rate, description, status,
      id, firm_id
    );

    res.json({ message: 'Stock item updated successfully' });

  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Failed to update stock item' });
  }
}

/**
 * Delete stock item
 */
export async function deleteStock(req, res) {
  try {
    const { firm_id, role } = req.user;
    const { id } = req.params;
    
    if (!firm_id && role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. No firm assigned.' });
    }

    // Check if stock has any movements
    const movementCount = db.prepare(`
      SELECT COUNT(*) as count FROM stock_reg 
      WHERE stock_id = ? AND firm_id = ? AND ref_type != 'OPENING'
    `).get(id, firm_id);
    
    if (movementCount.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete stock item with movements. Please mark as inactive instead.' 
      });
    }

    // Delete stock (will cascade delete register entries)
    const result = db.prepare(`
      DELETE FROM stocks WHERE id = ? AND firm_id = ?
    `).run(id, firm_id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Stock item not found' });
    }

    res.json({ message: 'Stock item deleted successfully' });

  } catch (error) {
    console.error('Error deleting stock:', error);
    res.status(500).json({ error: 'Failed to delete stock item' });
  }
}

/**
 * Get stock movements
 */
export async function getStockMovements(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;
    const { fromDate, toDate, limit = 100 } = req.query;

    let query = `
      SELECT sr.*, s.item_name, s.unit
      FROM stock_reg sr
      JOIN stocks s ON s.id = sr.stock_id
      WHERE sr.firm_id = ? AND sr.stock_id = ?
    `;
    const params = [firm_id, id];

    if (fromDate) {
      query += ` AND sr.movement_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND sr.movement_date <= ?`;
      params.push(toDate);
    }

    query += ` ORDER BY sr.movement_date DESC, sr.id DESC LIMIT ?`;
    params.push(parseInt(limit));

    const movements = db.prepare(query).all(...params);

    res.json(movements);

  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({ error: 'Failed to fetch stock movements' });
  }
}

/**
 * Add stock movement (manual adjustment)
 */
export async function addStockMovement(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;
    const { movement_type, qty, rate, remarks } = req.body;

    if (!movement_type || !qty) {
      return res.status(400).json({ error: 'Movement type and quantity are required' });
    }

    if (!['IN', 'OUT'].includes(movement_type)) {
      return res.status(400).json({ error: 'Invalid movement type' });
    }

    // Get current stock
    const stock = db.prepare(`
      SELECT * FROM stocks WHERE id = ? AND firm_id = ?
    `).get(id, firm_id);

    if (!stock) {
      return res.status(404).json({ error: 'Stock item not found' });
    }

    // Calculate new balance
    const qtyChange = movement_type === 'IN' ? qty : -qty;
    const newBalance = stock.current_stock + qtyChange;

    if (newBalance < 0) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Add movement
    db.transaction(() => {
      db.prepare(`
        INSERT INTO stock_reg (
          firm_id, stock_id, ref_type, movement_date, movement_type,
          qty, rate, amount, balance_qty, remarks
        ) VALUES (?, ?, 'ADJUSTMENT', date('now'), ?, ?, ?, ?, ?, ?)
      `).run(
        firm_id, id, movement_type, qty, rate || 0,
        qty * (rate || 0), newBalance, remarks || 'Manual adjustment'
      );

      db.prepare(`
        UPDATE stocks SET current_stock = ?, updated_at = datetime('now')
        WHERE id = ? AND firm_id = ?
      `).run(newBalance, id, firm_id);
    })();

    res.json({ 
      message: 'Stock movement added successfully',
      newBalance
    });

  } catch (error) {
    console.error('Error adding stock movement:', error);
    res.status(500).json({ error: 'Failed to add stock movement' });
  }
}

/**
 * Get stock register (complete history)
 */
export async function getStockRegister(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;
    const { fromDate, toDate } = req.query;

    // Get stock details
    const stock = db.prepare(`
      SELECT * FROM stocks WHERE id = ? AND firm_id = ?
    `).get(id, firm_id);

    if (!stock) {
      return res.status(404).json({ error: 'Stock item not found' });
    }

    // Get all movements
    let query = `
      SELECT * FROM stock_reg
      WHERE firm_id = ? AND stock_id = ?
    `;
    const params = [firm_id, id];

    if (fromDate) {
      query += ` AND movement_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND movement_date <= ?`;
      params.push(toDate);
    }

    query += ` ORDER BY movement_date, id`;

    const movements = db.prepare(query).all(...params);

    res.json({
      stock,
      movements,
      opening_stock: stock.opening_stock,
      current_stock: stock.current_stock
    });

  } catch (error) {
    console.error('Error fetching stock register:', error);
    res.status(500).json({ error: 'Failed to fetch stock register' });
  }
}

/**
 * Adjust stock (quick adjustment)
 */
export async function adjustStock(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;
    const { new_qty, remarks } = req.body;

    if (new_qty === undefined || new_qty < 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    // Get current stock
    const stock = db.prepare(`
      SELECT * FROM stocks WHERE id = ? AND firm_id = ?
    `).get(id, firm_id);

    if (!stock) {
      return res.status(404).json({ error: 'Stock item not found' });
    }

    const difference = new_qty - stock.current_stock;
    
    if (difference === 0) {
      return res.json({ message: 'No adjustment needed' });
    }

    const movement_type = difference > 0 ? 'IN' : 'OUT';
    const qty = Math.abs(difference);

    // Add adjustment
    db.transaction(() => {
      db.prepare(`
        INSERT INTO stock_reg (
          firm_id, stock_id, ref_type, movement_date, movement_type,
          qty, rate, amount, balance_qty, remarks
        ) VALUES (?, ?, 'ADJUSTMENT', date('now'), ?, ?, 0, 0, ?, ?)
      `).run(
        firm_id, id, movement_type, qty, new_qty,
        remarks || `Stock adjusted from ${stock.current_stock} to ${new_qty}`
      );

      db.prepare(`
        UPDATE stocks SET current_stock = ?, updated_at = datetime('now')
        WHERE id = ? AND firm_id = ?
      `).run(new_qty, id, firm_id);
    })();

    res.json({ 
      message: 'Stock adjusted successfully',
      old_qty: stock.current_stock,
      new_qty,
      difference
    });

  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
}

/**
 * Get low stock items
 */
export async function getLowStockItems(req, res) {
  try {
    const { firm_id } = req.user;

    const lowStockItems = db.prepare(`
      SELECT *,
             (current_stock * purchase_rate) as stock_value,
             (min_stock - current_stock) as shortage_qty
      FROM stocks
      WHERE firm_id = ? 
        AND status = 'Active'
        AND current_stock <= min_stock
      ORDER BY (min_stock - current_stock) DESC
    `).all(firm_id);

    res.json(lowStockItems);

  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
}

/**
 * Get stock summary
 */
export async function getStockSummary(req, res) {
  try {
    const { firm_id } = req.user;

    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total_items,
        SUM(current_stock) as total_qty,
        SUM(current_stock * purchase_rate) as total_value,
        SUM(CASE WHEN current_stock <= min_stock THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN current_stock = 0 THEN 1 ELSE 0 END) as out_of_stock_count,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_items
      FROM stocks
      WHERE firm_id = ?
    `).get(firm_id);

    res.json(summary);

  } catch (error) {
    console.error('Error fetching stock summary:', error);
    res.status(500).json({ error: 'Failed to fetch stock summary' });
  }
}

/**
 * Get stock valuation
 */
export async function getStockValuation(req, res) {
  try {
    const { firm_id } = req.user;
    const { category } = req.query;

    let query = `
      SELECT 
        category,
        COUNT(*) as item_count,
        SUM(current_stock) as total_qty,
        SUM(current_stock * purchase_rate) as purchase_value,
        SUM(current_stock * sale_rate) as sale_value,
        SUM(current_stock * (sale_rate - purchase_rate)) as potential_profit
      FROM stocks
      WHERE firm_id = ? AND status = 'Active'
    `;
    const params = [firm_id];

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    query += ` GROUP BY category ORDER BY purchase_value DESC`;

    const valuation = db.prepare(query).all(...params);

    // Get total
    const total = db.prepare(`
      SELECT 
        SUM(current_stock * purchase_rate) as total_purchase_value,
        SUM(current_stock * sale_rate) as total_sale_value,
        SUM(current_stock * (sale_rate - purchase_rate)) as total_potential_profit
      FROM stocks
      WHERE firm_id = ? AND status = 'Active'
    `).get(firm_id);

    res.json({
      by_category: valuation,
      total
    });

  } catch (error) {
    console.error('Error fetching stock valuation:', error);
    res.status(500).json({ error: 'Failed to fetch stock valuation' });
  }
}

/**
 * Search stocks
 */
export async function searchStocks(req, res) {
  try {
    const { firm_id } = req.user;
    const { query } = req.params;

    const stocks = db.prepare(`
      SELECT *,
             (current_stock * purchase_rate) as stock_value
      FROM stocks
      WHERE firm_id = ? 
        AND status = 'Active'
        AND (
          LOWER(item_name) LIKE LOWER(?) OR
          LOWER(item_code) LIKE LOWER(?) OR
          LOWER(hsn_code) LIKE LOWER(?)
        )
      ORDER BY item_name
      LIMIT 20
    `).all(firm_id, `%${query}%`, `%${query}%`, `%${query}%`);

    res.json(stocks);

  } catch (error) {
    console.error('Error searching stocks:', error);
    res.status(500).json({ error: 'Failed to search stocks' });
  }
}

/**
 * Import stocks (CSV/JSON)
 */
export async function importStocks(req, res) {
  try {
    const { firm_id } = req.user;
    const { stocks } = req.body;

    if (!Array.isArray(stocks) || stocks.length === 0) {
      return res.status(400).json({ error: 'Invalid stocks data' });
    }

    let imported = 0;
    let failed = 0;
    const errors = [];

    db.transaction(() => {
      stocks.forEach((stock, index) => {
        try {
          const result = db.prepare(`
            INSERT INTO stocks (
              firm_id, item_name, item_code, hsn_code, unit, category,
              opening_stock, current_stock, min_stock, max_stock,
              purchase_rate, sale_rate, gst_rate, cess_rate, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            firm_id,
            stock.item_name,
            stock.item_code,
            stock.hsn_code,
            stock.unit || 'PCS',
            stock.category,
            stock.opening_stock || 0,
            stock.opening_stock || 0,
            stock.min_stock || 0,
            stock.max_stock || 0,
            stock.purchase_rate || 0,
            stock.sale_rate || 0,
            stock.gst_rate || 0,
            stock.cess_rate || 0,
            stock.description
          );

          // Add opening stock entry if > 0
          if (stock.opening_stock > 0) {
            db.prepare(`
              INSERT INTO stock_reg (
                firm_id, stock_id, ref_type, movement_date, movement_type,
                qty, rate, amount, balance_qty, remarks
              ) VALUES (?, ?, 'OPENING', date('now'), 'IN', ?, ?, ?, ?, 'Opening Stock')
            `).run(
              firm_id, result.lastInsertRowid, stock.opening_stock,
              stock.purchase_rate || 0,
              (stock.opening_stock || 0) * (stock.purchase_rate || 0),
              stock.opening_stock
            );
          }

          imported++;
        } catch (err) {
          failed++;
          errors.push({ row: index + 1, error: err.message });
        }
      });
    })();

    res.json({
      message: 'Import completed',
      imported,
      failed,
      errors: errors.slice(0, 10)
    });

  } catch (error) {
    console.error('Error importing stocks:', error);
    res.status(500).json({ error: 'Failed to import stocks' });
  }
}

/**
 * Export stocks (CSV/JSON)
 */
export async function exportStocks(req, res) {
  try {
    const { firm_id } = req.user;
    const { format = 'json' } = req.query;

    const stocks = db.prepare(`
      SELECT *,
             (current_stock * purchase_rate) as stock_value
      FROM stocks
      WHERE firm_id = ?
      ORDER BY item_name
    `).all(firm_id);

    if (format === 'csv') {
      const headers = Object.keys(stocks[0] || {}).join(',');
      const rows = stocks.map(s => Object.values(s).join(',')).join('\n');
      const csv = `${headers}\n${rows}`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=stocks.csv');
      res.send(csv);
    } else {
      res.json(stocks);
    }

  } catch (error) {
    console.error('Error exporting stocks:', error);
    res.status(500).json({ error: 'Failed to export stocks' });
  }
}
