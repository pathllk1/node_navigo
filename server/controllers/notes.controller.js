/**
 * Notes Controller
 * Handles credit notes, debit notes, and delivery notes
 */

import { db } from '../utils/db.js';
import { getNextBillNumber } from '../utils/billNumberGenerator.js';
import { postBillToLedger, reverseLedgerEntries } from '../utils/ledgerHelper.js';

/**
 * Get all credit notes
 */
export async function getCreditNotes(req, res) {
  try {
    const { firm_id } = req.user;
    const { fromDate, toDate, party_id, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM bills
      WHERE firm_id = ? AND bill_type = 'CREDIT_NOTE'
    `;
    const params = [firm_id];

    if (fromDate) {
      query += ` AND bill_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND bill_date <= ?`;
      params.push(toDate);
    }

    if (party_id) {
      query += ` AND party_id = ?`;
      params.push(party_id);
    }

    query += ` ORDER BY bill_date DESC, id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const notes = db.prepare(query).all(...params);

    res.json(notes);

  } catch (error) {
    console.error('Error fetching credit notes:', error);
    res.status(500).json({ error: 'Failed to fetch credit notes' });
  }
}

/**
 * Get credit note by ID
 */
export async function getCreditNoteById(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;

    const note = db.prepare(`
      SELECT * FROM bills WHERE id = ? AND firm_id = ? AND bill_type = 'CREDIT_NOTE'
    `).get(id, firm_id);

    if (!note) {
      return res.status(404).json({ error: 'Credit note not found' });
    }

    // Get items
    const items = db.prepare(`
      SELECT * FROM bill_items WHERE bill_id = ?
    `).all(id);

    res.json({ ...note, items });

  } catch (error) {
    console.error('Error fetching credit note:', error);
    res.status(500).json({ error: 'Failed to fetch credit note' });
  }
}

/**
 * Create credit note
 */
export async function createCreditNote(req, res) {
  try {
    const { firm_id, id: user_id } = req.user;
    const {
      bill_date,
      party_id,
      party_name,
      party_gstin,
      original_bill_no,
      original_bill_date,
      items,
      reason,
      notes
    } = req.body;

    if (!bill_date || !party_id || !items || items.length === 0) {
      return res.status(400).json({
        error: 'Bill date, party, and items are required'
      });
    }

    // Generate credit note number
    const billNo = getNextBillNumber(firm_id, 'CREDIT_NOTE');

    // Calculate totals
    let gross_total = 0;
    let cgst = 0, sgst = 0, igst = 0;

    items.forEach(item => {
      const amount = item.qty * item.rate;
      gross_total += amount;
      
      if (item.gst_rate) {
        const gst_amount = (amount * item.gst_rate) / 100;
        if (item.is_igst) {
          igst += gst_amount;
        } else {
          cgst += gst_amount / 2;
          sgst += gst_amount / 2;
        }
      }
    });

    const net_total = gross_total + cgst + sgst + igst;

    const result = db.transaction(() => {
      // Create credit note
      const billResult = db.prepare(`
        INSERT INTO bills (
          firm_id, bill_type, bill_no, bill_date, party_id, party_name, party_gstin,
          gross_total, cgst, sgst, igst, net_total, status, notes, created_by
        ) VALUES (?, 'CREDIT_NOTE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?)
      `).run(
        firm_id, billNo, bill_date, party_id, party_name, party_gstin,
        gross_total, cgst, sgst, igst, net_total, 
        `Original Bill: ${original_bill_no || 'N/A'}, Reason: ${reason || 'N/A'}, ${notes || ''}`,
        user_id
      );

      const billId = billResult.lastInsertRowid;

      // Insert items
      const itemStmt = db.prepare(`
        INSERT INTO bill_items (
          bill_id, item_name, hsn_code, qty, unit, rate, gst_rate, amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      items.forEach(item => {
        const amount = item.qty * item.rate;
        itemStmt.run(
          billId, item.item_name, item.hsn_code, item.qty,
          item.unit, item.rate, item.gst_rate, amount
        );

        // Add stock back (credit note = return)
        if (item.stock_id) {
          db.prepare(`
            UPDATE stocks SET current_stock = current_stock + ? WHERE id = ?
          `).run(item.qty, item.stock_id);

          // Record stock movement
          db.prepare(`
            INSERT INTO stock_reg (
              stock_id, movement_date, movement_type, qty, rate, 
              ref_type, ref_id, balance
            ) VALUES (?, ?, 'IN', ?, ?, 'CREDIT_NOTE', ?, 
              (SELECT current_stock FROM stocks WHERE id = ?))
          `).run(item.stock_id, bill_date, item.qty, item.rate, billId, item.stock_id);
        }
      });

      // Post to ledger (reverse of sales)
      const bill = db.prepare(`SELECT * FROM bills WHERE id = ?`).get(billId);
      
      // Debit: Sales (reduce sales)
      db.prepare(`
        INSERT INTO ledger (
          firm_id, entry_date, account_name, account_type,
          debit, credit, narration, ref_type, ref_id
        ) VALUES (?, ?, 'Sales', 'SALES', ?, 0, ?, 'BILL', ?)
      `).run(firm_id, bill_date, gross_total, `Credit Note: ${billNo}`, billId);

      // Credit: Party (reduce receivable)
      db.prepare(`
        INSERT INTO ledger (
          firm_id, entry_date, account_name, account_type,
          debit, credit, narration, ref_type, ref_id
        ) VALUES (?, ?, ?, 'SUNDRY_DEBTORS', 0, ?, ?, 'BILL', ?)
      `).run(firm_id, bill_date, party_name, net_total, `Credit Note: ${billNo}`, billId);

      return { billId, billNo };
    })();

    res.status(201).json({
      message: 'Credit note created successfully',
      billId: result.billId,
      billNo: result.billNo
    });

  } catch (error) {
    console.error('Error creating credit note:', error);
    res.status(500).json({ error: 'Failed to create credit note' });
  }
}

/**
 * Update credit note
 */
export async function updateCreditNote(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;
    const { status, notes } = req.body;

    const existing = db.prepare(`
      SELECT * FROM bills WHERE id = ? AND firm_id = ? AND bill_type = 'CREDIT_NOTE'
    `).get(id, firm_id);

    if (!existing) {
      return res.status(404).json({ error: 'Credit note not found' });
    }

    db.prepare(`
      UPDATE bills SET
        status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        updated_at = datetime('now')
      WHERE id = ? AND firm_id = ?
    `).run(status, notes, id, firm_id);

    res.json({ message: 'Credit note updated successfully' });

  } catch (error) {
    console.error('Error updating credit note:', error);
    res.status(500).json({ error: 'Failed to update credit note' });
  }
}

/**
 * Delete credit note
 */
export async function deleteCreditNote(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;

    const note = db.prepare(`
      SELECT * FROM bills WHERE id = ? AND firm_id = ? AND bill_type = 'CREDIT_NOTE'
    `).get(id, firm_id);

    if (!note) {
      return res.status(404).json({ error: 'Credit note not found' });
    }

    db.transaction(() => {
      // Reverse stock movements
      const items = db.prepare(`SELECT * FROM bill_items WHERE bill_id = ?`).all(id);
      
      items.forEach(item => {
        if (item.stock_id) {
          db.prepare(`
            UPDATE stocks SET current_stock = current_stock - ? WHERE id = ?
          `).run(item.qty, item.stock_id);
        }
      });

      // Reverse ledger entries
      reverseLedgerEntries('BILL', id);

      // Delete items
      db.prepare(`DELETE FROM bill_items WHERE bill_id = ?`).run(id);

      // Delete credit note
      db.prepare(`DELETE FROM bills WHERE id = ? AND firm_id = ?`).run(id, firm_id);
    })();

    res.json({ message: 'Credit note deleted successfully' });

  } catch (error) {
    console.error('Error deleting credit note:', error);
    res.status(500).json({ error: 'Failed to delete credit note' });
  }
}

/**
 * Get credit note PDF
 */
export async function getCreditNotePDF(req, res) {
  try {
    res.json({ message: 'PDF generation not implemented yet' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}

/**
 * Get all debit notes
 */
export async function getDebitNotes(req, res) {
  try {
    const { firm_id } = req.user;
    const { fromDate, toDate, party_id, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM bills
      WHERE firm_id = ? AND bill_type = 'DEBIT_NOTE'
    `;
    const params = [firm_id];

    if (fromDate) {
      query += ` AND bill_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND bill_date <= ?`;
      params.push(toDate);
    }

    if (party_id) {
      query += ` AND party_id = ?`;
      params.push(party_id);
    }

    query += ` ORDER BY bill_date DESC, id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const notes = db.prepare(query).all(...params);

    res.json(notes);

  } catch (error) {
    console.error('Error fetching debit notes:', error);
    res.status(500).json({ error: 'Failed to fetch debit notes' });
  }
}

/**
 * Get debit note by ID
 */
export async function getDebitNoteById(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;

    const note = db.prepare(`
      SELECT * FROM bills WHERE id = ? AND firm_id = ? AND bill_type = 'DEBIT_NOTE'
    `).get(id, firm_id);

    if (!note) {
      return res.status(404).json({ error: 'Debit note not found' });
    }

    const items = db.prepare(`
      SELECT * FROM bill_items WHERE bill_id = ?
    `).all(id);

    res.json({ ...note, items });

  } catch (error) {
    console.error('Error fetching debit note:', error);
    res.status(500).json({ error: 'Failed to fetch debit note' });
  }
}

/**
 * Create debit note
 */
export async function createDebitNote(req, res) {
  try {
    const { firm_id, id: user_id } = req.user;
    const {
      bill_date,
      party_id,
      party_name,
      party_gstin,
      original_bill_no,
      original_bill_date,
      items,
      reason,
      notes
    } = req.body;

    if (!bill_date || !party_id || !items || items.length === 0) {
      return res.status(400).json({
        error: 'Bill date, party, and items are required'
      });
    }

    const billNo = getNextBillNumber(firm_id, 'DEBIT_NOTE');

    let gross_total = 0;
    let cgst = 0, sgst = 0, igst = 0;

    items.forEach(item => {
      const amount = item.qty * item.rate;
      gross_total += amount;
      
      if (item.gst_rate) {
        const gst_amount = (amount * item.gst_rate) / 100;
        if (item.is_igst) {
          igst += gst_amount;
        } else {
          cgst += gst_amount / 2;
          sgst += gst_amount / 2;
        }
      }
    });

    const net_total = gross_total + cgst + sgst + igst;

    const result = db.transaction(() => {
      const billResult = db.prepare(`
        INSERT INTO bills (
          firm_id, bill_type, bill_no, bill_date, party_id, party_name, party_gstin,
          gross_total, cgst, sgst, igst, net_total, status, notes, created_by
        ) VALUES (?, 'DEBIT_NOTE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?)
      `).run(
        firm_id, billNo, bill_date, party_id, party_name, party_gstin,
        gross_total, cgst, sgst, igst, net_total,
        `Original Bill: ${original_bill_no || 'N/A'}, Reason: ${reason || 'N/A'}, ${notes || ''}`,
        user_id
      );

      const billId = billResult.lastInsertRowid;

      const itemStmt = db.prepare(`
        INSERT INTO bill_items (
          bill_id, item_name, hsn_code, qty, unit, rate, gst_rate, amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      items.forEach(item => {
        const amount = item.qty * item.rate;
        itemStmt.run(
          billId, item.item_name, item.hsn_code, item.qty,
          item.unit, item.rate, item.gst_rate, amount
        );

        // Reduce stock (debit note = return to supplier)
        if (item.stock_id) {
          db.prepare(`
            UPDATE stocks SET current_stock = current_stock - ? WHERE id = ?
          `).run(item.qty, item.stock_id);

          db.prepare(`
            INSERT INTO stock_reg (
              stock_id, movement_date, movement_type, qty, rate,
              ref_type, ref_id, balance
            ) VALUES (?, ?, 'OUT', ?, ?, 'DEBIT_NOTE', ?,
              (SELECT current_stock FROM stocks WHERE id = ?))
          `).run(item.stock_id, bill_date, item.qty, item.rate, billId, item.stock_id);
        }
      });

      // Post to ledger (reverse of purchase)
      // Credit: Purchase (reduce purchase)
      db.prepare(`
        INSERT INTO ledger (
          firm_id, entry_date, account_name, account_type,
          debit, credit, narration, ref_type, ref_id
        ) VALUES (?, ?, 'Purchase', 'PURCHASE', 0, ?, ?, 'BILL', ?)
      `).run(firm_id, bill_date, gross_total, `Debit Note: ${billNo}`, billId);

      // Debit: Party (reduce payable)
      db.prepare(`
        INSERT INTO ledger (
          firm_id, entry_date, account_name, account_type,
          debit, credit, narration, ref_type, ref_id
        ) VALUES (?, ?, ?, 'SUNDRY_CREDITORS', ?, 0, ?, 'BILL', ?)
      `).run(firm_id, bill_date, party_name, net_total, `Debit Note: ${billNo}`, billId);

      return { billId, billNo };
    })();

    res.status(201).json({
      message: 'Debit note created successfully',
      billId: result.billId,
      billNo: result.billNo
    });

  } catch (error) {
    console.error('Error creating debit note:', error);
    res.status(500).json({ error: 'Failed to create debit note' });
  }
}

/**
 * Update debit note
 */
export async function updateDebitNote(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;
    const { status, notes } = req.body;

    const existing = db.prepare(`
      SELECT * FROM bills WHERE id = ? AND firm_id = ? AND bill_type = 'DEBIT_NOTE'
    `).get(id, firm_id);

    if (!existing) {
      return res.status(404).json({ error: 'Debit note not found' });
    }

    db.prepare(`
      UPDATE bills SET
        status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        updated_at = datetime('now')
      WHERE id = ? AND firm_id = ?
    `).run(status, notes, id, firm_id);

    res.json({ message: 'Debit note updated successfully' });

  } catch (error) {
    console.error('Error updating debit note:', error);
    res.status(500).json({ error: 'Failed to update debit note' });
  }
}

/**
 * Delete debit note
 */
export async function deleteDebitNote(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;

    const note = db.prepare(`
      SELECT * FROM bills WHERE id = ? AND firm_id = ? AND bill_type = 'DEBIT_NOTE'
    `).get(id, firm_id);

    if (!note) {
      return res.status(404).json({ error: 'Debit note not found' });
    }

    db.transaction(() => {
      const items = db.prepare(`SELECT * FROM bill_items WHERE bill_id = ?`).all(id);
      
      items.forEach(item => {
        if (item.stock_id) {
          db.prepare(`
            UPDATE stocks SET current_stock = current_stock + ? WHERE id = ?
          `).run(item.qty, item.stock_id);
        }
      });

      reverseLedgerEntries('BILL', id);
      db.prepare(`DELETE FROM bill_items WHERE bill_id = ?`).run(id);
      db.prepare(`DELETE FROM bills WHERE id = ? AND firm_id = ?`).run(id, firm_id);
    })();

    res.json({ message: 'Debit note deleted successfully' });

  } catch (error) {
    console.error('Error deleting debit note:', error);
    res.status(500).json({ error: 'Failed to delete debit note' });
  }
}

/**
 * Get debit note PDF
 */
export async function getDebitNotePDF(req, res) {
  try {
    res.json({ message: 'PDF generation not implemented yet' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}

/**
 * Get all delivery notes
 */
export async function getDeliveryNotes(req, res) {
  try {
    const { firm_id } = req.user;
    const { fromDate, toDate, party_id, status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM bills
      WHERE firm_id = ? AND bill_type = 'DELIVERY_NOTE'
    `;
    const params = [firm_id];

    if (fromDate) {
      query += ` AND bill_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND bill_date <= ?`;
      params.push(toDate);
    }

    if (party_id) {
      query += ` AND party_id = ?`;
      params.push(party_id);
    }

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY bill_date DESC, id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const notes = db.prepare(query).all(...params);

    res.json(notes);

  } catch (error) {
    console.error('Error fetching delivery notes:', error);
    res.status(500).json({ error: 'Failed to fetch delivery notes' });
  }
}

/**
 * Get delivery note by ID
 */
export async function getDeliveryNoteById(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;

    const note = db.prepare(`
      SELECT * FROM bills WHERE id = ? AND firm_id = ? AND bill_type = 'DELIVERY_NOTE'
    `).get(id, firm_id);

    if (!note) {
      return res.status(404).json({ error: 'Delivery note not found' });
    }

    const items = db.prepare(`
      SELECT * FROM bill_items WHERE bill_id = ?
    `).all(id);

    res.json({ ...note, items });

  } catch (error) {
    console.error('Error fetching delivery note:', error);
    res.status(500).json({ error: 'Failed to fetch delivery note' });
  }
}

/**
 * Create delivery note
 */
export async function createDeliveryNote(req, res) {
  try {
    const { firm_id, id: user_id } = req.user;
    const {
      bill_date,
      party_id,
      party_name,
      items,
      notes
    } = req.body;

    if (!bill_date || !party_id || !items || items.length === 0) {
      return res.status(400).json({
        error: 'Bill date, party, and items are required'
      });
    }

    const billNo = getNextBillNumber(firm_id, 'DELIVERY_NOTE');

    let gross_total = 0;

    items.forEach(item => {
      gross_total += item.qty * item.rate;
    });

    const result = db.transaction(() => {
      const billResult = db.prepare(`
        INSERT INTO bills (
          firm_id, bill_type, bill_no, bill_date, party_id, party_name,
          gross_total, cgst, sgst, igst, net_total, status, notes, created_by
        ) VALUES (?, 'DELIVERY_NOTE', ?, ?, ?, ?, ?, 0, 0, 0, ?, 'PENDING', ?, ?)
      `).run(
        firm_id, billNo, bill_date, party_id, party_name,
        gross_total, gross_total, notes || '', user_id
      );

      const billId = billResult.lastInsertRowid;

      const itemStmt = db.prepare(`
        INSERT INTO bill_items (
          bill_id, item_name, hsn_code, qty, unit, rate, gst_rate, amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      items.forEach(item => {
        const amount = item.qty * item.rate;
        itemStmt.run(
          billId, item.item_name, item.hsn_code, item.qty,
          item.unit, item.rate, item.gst_rate || 0, amount
        );

        // Reduce stock (goods delivered)
        if (item.stock_id) {
          db.prepare(`
            UPDATE stocks SET current_stock = current_stock - ? WHERE id = ?
          `).run(item.qty, item.stock_id);

          db.prepare(`
            INSERT INTO stock_reg (
              stock_id, movement_date, movement_type, qty, rate,
              ref_type, ref_id, balance
            ) VALUES (?, ?, 'OUT', ?, ?, 'DELIVERY_NOTE', ?,
              (SELECT current_stock FROM stocks WHERE id = ?))
          `).run(item.stock_id, bill_date, item.qty, item.rate, billId, item.stock_id);
        }
      });

      return { billId, billNo };
    })();

    res.status(201).json({
      message: 'Delivery note created successfully',
      billId: result.billId,
      billNo: result.billNo
    });

  } catch (error) {
    console.error('Error creating delivery note:', error);
    res.status(500).json({ error: 'Failed to create delivery note' });
  }
}

/**
 * Update delivery note
 */
export async function updateDeliveryNote(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;
    const { status, notes } = req.body;

    const existing = db.prepare(`
      SELECT * FROM bills WHERE id = ? AND firm_id = ? AND bill_type = 'DELIVERY_NOTE'
    `).get(id, firm_id);

    if (!existing) {
      return res.status(404).json({ error: 'Delivery note not found' });
    }

    if (existing.status === 'CONVERTED') {
      return res.status(400).json({
        error: 'Cannot update converted delivery note'
      });
    }

    db.prepare(`
      UPDATE bills SET
        status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        updated_at = datetime('now')
      WHERE id = ? AND firm_id = ?
    `).run(status, notes, id, firm_id);

    res.json({ message: 'Delivery note updated successfully' });

  } catch (error) {
    console.error('Error updating delivery note:', error);
    res.status(500).json({ error: 'Failed to update delivery note' });
  }
}

/**
 * Delete delivery note
 */
export async function deleteDeliveryNote(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;

    const note = db.prepare(`
      SELECT * FROM bills WHERE id = ? AND firm_id = ? AND bill_type = 'DELIVERY_NOTE'
    `).get(id, firm_id);

    if (!note) {
      return res.status(404).json({ error: 'Delivery note not found' });
    }

    if (note.status === 'CONVERTED') {
      return res.status(400).json({
        error: 'Cannot delete converted delivery note'
      });
    }

    db.transaction(() => {
      const items = db.prepare(`SELECT * FROM bill_items WHERE bill_id = ?`).all(id);
      
      // Add stock back
      items.forEach(item => {
        if (item.stock_id) {
          db.prepare(`
            UPDATE stocks SET current_stock = current_stock + ? WHERE id = ?
          `).run(item.qty, item.stock_id);
        }
      });

      db.prepare(`DELETE FROM bill_items WHERE bill_id = ?`).run(id);
      db.prepare(`DELETE FROM bills WHERE id = ? AND firm_id = ?`).run(id, firm_id);
    })();

    res.json({ message: 'Delivery note deleted successfully' });

  } catch (error) {
    console.error('Error deleting delivery note:', error);
    res.status(500).json({ error: 'Failed to delete delivery note' });
  }
}

/**
 * Convert delivery note to sales bill
 */
export async function convertDeliveryNoteToSales(req, res) {
  try {
    const { firm_id, id: user_id } = req.user;
    const { id } = req.params;
    const { party_gstin, gst_rates } = req.body;

    const deliveryNote = db.prepare(`
      SELECT * FROM bills WHERE id = ? AND firm_id = ? AND bill_type = 'DELIVERY_NOTE'
    `).get(id, firm_id);

    if (!deliveryNote) {
      return res.status(404).json({ error: 'Delivery note not found' });
    }

    if (deliveryNote.status === 'CONVERTED') {
      return res.status(400).json({
        error: 'Delivery note already converted'
      });
    }

    const items = db.prepare(`SELECT * FROM bill_items WHERE bill_id = ?`).all(id);

    const result = db.transaction(() => {
      // Generate sales bill number
      const salesBillNo = getNextBillNumber(firm_id, 'SALES');

      // Calculate GST
      let gross_total = 0;
      let cgst = 0, sgst = 0, igst = 0;

      items.forEach((item, index) => {
        const amount = item.qty * item.rate;
        gross_total += amount;
        
        const gst_rate = gst_rates?.[index] || item.gst_rate || 0;
        if (gst_rate > 0) {
          const gst_amount = (amount * gst_rate) / 100;
          // Assume intra-state for simplicity
          cgst += gst_amount / 2;
          sgst += gst_amount / 2;
        }
      });

      const net_total = gross_total + cgst + sgst + igst;

      // Create sales bill
      const salesResult = db.prepare(`
        INSERT INTO bills (
          firm_id, bill_type, bill_no, bill_date, party_id, party_name, party_gstin,
          gross_total, cgst, sgst, igst, net_total, status, notes, created_by
        ) VALUES (?, 'SALES', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
      `).run(
        firm_id, salesBillNo, deliveryNote.bill_date, deliveryNote.party_id,
        deliveryNote.party_name, party_gstin,
        gross_total, cgst, sgst, igst, net_total,
        `Converted from Delivery Note: ${deliveryNote.bill_no}`,
        user_id
      );

      const salesBillId = salesResult.lastInsertRowid;

      // Copy items to sales bill
      const itemStmt = db.prepare(`
        INSERT INTO bill_items (
          bill_id, item_name, hsn_code, qty, unit, rate, gst_rate, amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      items.forEach((item, index) => {
        const gst_rate = gst_rates?.[index] || item.gst_rate || 0;
        itemStmt.run(
          salesBillId, item.item_name, item.hsn_code, item.qty,
          item.unit, item.rate, gst_rate, item.amount
        );
      });

      // Post to ledger
      const salesBill = db.prepare(`SELECT * FROM bills WHERE id = ?`).get(salesBillId);
      postBillToLedger(salesBill, 'SALES');

      // Mark delivery note as converted
      db.prepare(`
        UPDATE bills SET status = 'CONVERTED', updated_at = datetime('now')
        WHERE id = ?
      `).run(id);

      return { salesBillId, salesBillNo };
    })();

    res.status(201).json({
      message: 'Delivery note converted to sales bill successfully',
      salesBillId: result.salesBillId,
      salesBillNo: result.salesBillNo
    });

  } catch (error) {
    console.error('Error converting delivery note:', error);
    res.status(500).json({ error: 'Failed to convert delivery note' });
  }
}

/**
 * Get delivery note PDF
 */
export async function getDeliveryNotePDF(req, res) {
  try {
    res.json({ message: 'PDF generation not implemented yet' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}
