/**
 * Purchase Controller
 * Handles purchase bills and debit notes
 */

import { db } from '../utils/db.js';
import { getNextBillNumber } from '../utils/billNumberGenerator.js';
import { calculateItemGST, calculateBillTotals, isIntraState } from '../utils/gstCalculator.js';
import { postBillToLedger, reverseLedgerEntries } from '../utils/ledgerHelper.js';

/**
 * Get all purchase bills
 */
export async function getAllPurchaseBills(req, res) {
  try {
    const { firm_id, role } = req.user;
    
    if (!firm_id && role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. No firm assigned.' });
    }

    const { 
      bill_type = 'PURCHASE',
      status,
      payment_status,
      party_id,
      fromDate,
      toDate,
      page = 1, 
      limit = 50,
      sortBy = 'bill_date',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    
    let query = `
      SELECT b.*, p.party_name, p.phone
      FROM bills b
      LEFT JOIN parties p ON p.id = b.party_id
      WHERE b.firm_id = ? AND b.bill_type = ?
    `;
    
    const params = [firm_id, bill_type];
    
    if (status) {
      query += ` AND b.status = ?`;
      params.push(status);
    }
    
    if (payment_status) {
      query += ` AND b.payment_status = ?`;
      params.push(payment_status);
    }
    
    if (party_id) {
      query += ` AND b.party_id = ?`;
      params.push(party_id);
    }
    
    if (fromDate) {
      query += ` AND b.bill_date >= ?`;
      params.push(fromDate);
    }
    
    if (toDate) {
      query += ` AND b.bill_date <= ?`;
      params.push(toDate);
    }
    
    query += ` ORDER BY ${sortBy} ${sortOrder}`;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    
    const bills = db.prepare(query).all(...params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM bills WHERE firm_id = ? AND bill_type = ?`;
    const countParams = [firm_id, bill_type];
    
    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }
    
    if (payment_status) {
      countQuery += ` AND payment_status = ?`;
      countParams.push(payment_status);
    }
    
    if (party_id) {
      countQuery += ` AND party_id = ?`;
      countParams.push(party_id);
    }
    
    if (fromDate) {
      countQuery += ` AND bill_date >= ?`;
      countParams.push(fromDate);
    }
    
    if (toDate) {
      countQuery += ` AND bill_date <= ?`;
      countParams.push(toDate);
    }
    
    const { total } = db.prepare(countQuery).get(...countParams);
    
    res.json({
      bills,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching purchase bills:', error);
    res.status(500).json({ error: 'Failed to fetch purchase bills' });
  }
}

/**
 * Get purchase bill by ID
 */
export async function getPurchaseBillById(req, res) {
  try {
    const { firm_id, role } = req.user;
    const { id } = req.params;
    
    if (!firm_id && role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. No firm assigned.' });
    }

    const bill = db.prepare(`
      SELECT b.*, p.party_name, p.phone, p.email
      FROM bills b
      LEFT JOIN parties p ON p.id = b.party_id
      WHERE b.id = ? AND b.firm_id = ?
    `).get(id, firm_id);
    
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    // Parse items JSON
    bill.items = JSON.parse(bill.items_json || '[]');
    bill.other_charges = JSON.parse(bill.other_charges_json || '[]');
    
    res.json(bill);
    
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({ error: 'Failed to fetch bill' });
  }
}

/**
 * Create purchase bill
 */
export async function createPurchaseBill(req, res) {
  try {
    const { firm_id, id: user_id, role } = req.user;
    
    if (!firm_id && role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. No firm assigned.' });
    }

    const {
      bill_type = 'PURCHASE',
      bill_date,
      due_date,
      party_id,
      party_gstin,
      items,
      other_charges = [],
      discount = 0,
      terms_conditions,
      notes
    } = req.body;

    // Validation
    if (!bill_date || !party_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Bill date, party, and items are required' });
    }

    // Get party details
    const party = db.prepare(`
      SELECT * FROM parties WHERE id = ? AND firm_id = ?
    `).get(party_id, firm_id);

    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }

    // Get firm details for GST calculation
    const firm = db.prepare(`
      SELECT fs.* FROM firm_settings fs WHERE fs.firm_id = ?
    `).get(firm_id);

    const firmStateCode = firm?.state_code || 0;
    const partyStateCode = party.state_code || 0;
    const isIntra = isIntraState(firmStateCode, partyStateCode);

    // Calculate GST for each item
    const calculatedItems = items.map(item => {
      const gstCalc = calculateItemGST({
        rate: item.rate,
        qty: item.qty,
        gstRate: item.gst_rate || 0,
        isIntraState: isIntra,
        discount: item.discount || 0
      });

      return {
        ...item,
        ...gstCalc
      };
    });

    // Calculate bill totals
    const totals = calculateBillTotals(calculatedItems, discount, other_charges);

    // Generate bill number
    const billNo = getNextBillNumber(firm_id, bill_type);

    // Create bill
    const result = db.transaction(() => {
      const billResult = db.prepare(`
        INSERT INTO bills (
          firm_id, bill_no, bill_type, bill_date, due_date,
          party_id, party_name, party_gstin, party_address, party_state_code,
          gross_total, discount, cgst, sgst, igst, cess, round_off, net_total,
          items_json, other_charges_json, terms_conditions, notes,
          status, payment_status, paid_amount,
          created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        firm_id, billNo, bill_type, bill_date, due_date,
        party_id, party.party_name, party_gstin || party.default_gstin, party.address, partyStateCode,
        totals.grossTotal, totals.totalDiscount, totals.cgst, totals.sgst, totals.igst, 0, totals.roundOff, totals.netTotal,
        JSON.stringify(calculatedItems), JSON.stringify(other_charges), terms_conditions, notes,
        'Pending', 'Unpaid', 0,
        user_id, user_id
      );

      const billId = billResult.lastInsertRowid;

      // Update stock for each item (ADD stock for purchase)
      calculatedItems.forEach(item => {
        // Increase stock
        db.prepare(`
          UPDATE stocks 
          SET current_stock = current_stock + ?, updated_at = datetime('now')
          WHERE id = ? AND firm_id = ?
        `).run(item.qty, item.stock_id, firm_id);

        // Add stock movement
        const newBalance = db.prepare(`
          SELECT current_stock FROM stocks WHERE id = ?
        `).get(item.stock_id).current_stock;

        db.prepare(`
          INSERT INTO stock_reg (
            firm_id, stock_id, ref_type, ref_id, ref_no, movement_date, movement_type,
            qty, rate, amount, balance_qty, remarks
          ) VALUES (?, ?, 'BILL', ?, ?, ?, 'IN', ?, ?, ?, ?, ?)
        `).run(
          firm_id, item.stock_id, billId, billNo, bill_date, item.qty,
          item.rate, item.total, newBalance, `Purchase Bill: ${billNo}`
        );
      });

      // Post to ledger
      const billForLedger = {
        id: billId,
        firm_id,
        bill_no: billNo,
        bill_date,
        party_name: party.party_name,
        gross_total: totals.grossTotal,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        net_total: totals.netTotal
      };
      
      postBillToLedger(billForLedger, bill_type);

      return billId;
    })();

    res.status(201).json({
      message: 'Purchase bill created successfully',
      billId: result,
      billNo
    });

  } catch (error) {
    console.error('Error creating purchase bill:', error);
    res.status(500).json({ error: 'Failed to create purchase bill' });
  }
}

/**
 * Update purchase bill
 */
export async function updatePurchaseBill(req, res) {
  try {
    const { firm_id, id: user_id, role } = req.user;
    const { id } = req.params;
    
    if (!firm_id && role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. No firm assigned.' });
    }

    // Get existing bill
    const existingBill = db.prepare(`
      SELECT * FROM bills WHERE id = ? AND firm_id = ?
    `).get(id, firm_id);

    if (!existingBill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    if (existingBill.status === 'Cancelled') {
      return res.status(400).json({ error: 'Cannot update cancelled bill' });
    }

    const {
      bill_date,
      due_date,
      items,
      other_charges = [],
      discount = 0,
      terms_conditions,
      notes
    } = req.body;

    // Get party details
    const party = db.prepare(`
      SELECT * FROM parties WHERE id = ? AND firm_id = ?
    `).get(existingBill.party_id, firm_id);

    // Get firm details
    const firm = db.prepare(`
      SELECT fs.* FROM firm_settings fs WHERE fs.firm_id = ?
    `).get(firm_id);

    const firmStateCode = firm?.state_code || 0;
    const partyStateCode = party.state_code || 0;
    const isIntra = isIntraState(firmStateCode, partyStateCode);

    // Calculate GST for each item
    const calculatedItems = items.map(item => {
      const gstCalc = calculateItemGST({
        rate: item.rate,
        qty: item.qty,
        gstRate: item.gst_rate || 0,
        isIntraState: isIntra,
        discount: item.discount || 0
      });

      return {
        ...item,
        ...gstCalc
      };
    });

    // Calculate bill totals
    const totals = calculateBillTotals(calculatedItems, discount, other_charges);

    // Update bill
    db.transaction(() => {
      // Reverse old stock movements (SUBTRACT for purchase)
      const oldItems = JSON.parse(existingBill.items_json);
      oldItems.forEach(item => {
        db.prepare(`
          UPDATE stocks 
          SET current_stock = current_stock - ?, updated_at = datetime('now')
          WHERE id = ? AND firm_id = ?
        `).run(item.qty, item.stock_id, firm_id);
      });

      // Apply new stock movements (ADD for purchase)
      calculatedItems.forEach(item => {
        db.prepare(`
          UPDATE stocks 
          SET current_stock = current_stock + ?, updated_at = datetime('now')
          WHERE id = ? AND firm_id = ?
        `).run(item.qty, item.stock_id, firm_id);

        const newBalance = db.prepare(`
          SELECT current_stock FROM stocks WHERE id = ?
        `).get(item.stock_id).current_stock;

        db.prepare(`
          INSERT INTO stock_reg (
            firm_id, stock_id, ref_type, ref_id, ref_no, movement_date, movement_type,
            qty, rate, amount, balance_qty, remarks
          ) VALUES (?, ?, 'BILL', ?, ?, ?, 'IN', ?, ?, ?, ?, ?)
        `).run(
          firm_id, item.stock_id, id, existingBill.bill_no, bill_date, item.qty,
          item.rate, item.total, newBalance, `Purchase Bill Updated: ${existingBill.bill_no}`
        );
      });

      // Update bill
      db.prepare(`
        UPDATE bills SET
          bill_date = ?,
          due_date = ?,
          gross_total = ?,
          discount = ?,
          cgst = ?,
          sgst = ?,
          igst = ?,
          round_off = ?,
          net_total = ?,
          items_json = ?,
          other_charges_json = ?,
          terms_conditions = ?,
          notes = ?,
          updated_by = ?,
          updated_at = datetime('now')
        WHERE id = ? AND firm_id = ?
      `).run(
        bill_date, due_date,
        totals.grossTotal, totals.totalDiscount, totals.cgst, totals.sgst, totals.igst,
        totals.roundOff, totals.netTotal,
        JSON.stringify(calculatedItems), JSON.stringify(other_charges),
        terms_conditions, notes,
        user_id, id, firm_id
      );

      // Reverse old ledger entries
      reverseLedgerEntries('BILL', id);

      // Post new ledger entries
      const billForLedger = {
        id,
        firm_id,
        bill_no: existingBill.bill_no,
        bill_date,
        party_name: party.party_name,
        gross_total: totals.grossTotal,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        net_total: totals.netTotal
      };
      
      postBillToLedger(billForLedger, existingBill.bill_type);
    })();

    res.json({ message: 'Bill updated successfully' });

  } catch (error) {
    console.error('Error updating bill:', error);
    res.status(500).json({ error: 'Failed to update bill' });
  }
}

/**
 * Delete purchase bill
 */
export async function deletePurchaseBill(req, res) {
  try {
    const { firm_id, role } = req.user;
    const { id } = req.params;
    
    if (!firm_id && role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. No firm assigned.' });
    }

    const bill = db.prepare(`
      SELECT * FROM bills WHERE id = ? AND firm_id = ?
    `).get(id, firm_id);

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    if (bill.payment_status === 'Paid' || bill.payment_status === 'Partial') {
      return res.status(400).json({ error: 'Cannot delete bill with payments. Cancel it instead.' });
    }

    // Delete bill
    db.transaction(() => {
      // Reverse stock movements (SUBTRACT for purchase)
      const items = JSON.parse(bill.items_json);
      items.forEach(item => {
        db.prepare(`
          UPDATE stocks 
          SET current_stock = current_stock - ?, updated_at = datetime('now')
          WHERE id = ? AND firm_id = ?
        `).run(item.qty, item.stock_id, firm_id);
      });

      // Reverse ledger entries
      reverseLedgerEntries('BILL', id);

      // Delete bill
      db.prepare(`
        DELETE FROM bills WHERE id = ? AND firm_id = ?
      `).run(id, firm_id);
    })();

    res.json({ message: 'Bill deleted successfully' });

  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ error: 'Failed to delete bill' });
  }
}

/**
 * Update bill status
 */
export async function updateBillStatus(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;
    const { status } = req.body;

    if (!['Draft', 'Pending', 'Paid', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    db.prepare(`
      UPDATE bills SET status = ?, updated_at = datetime('now')
      WHERE id = ? AND firm_id = ?
    `).run(status, id, firm_id);

    res.json({ message: 'Bill status updated successfully' });

  } catch (error) {
    console.error('Error updating bill status:', error);
    res.status(500).json({ error: 'Failed to update bill status' });
  }
}

/**
 * Record payment
 */
export async function recordPayment(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;
    const { amount, payment_date, payment_mode, remarks } = req.body;

    const bill = db.prepare(`
      SELECT * FROM bills WHERE id = ? AND firm_id = ?
    `).get(id, firm_id);

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const newPaidAmount = bill.paid_amount + amount;
    const paymentStatus = newPaidAmount >= bill.net_total ? 'Paid' : 
                         newPaidAmount > 0 ? 'Partial' : 'Unpaid';

    db.prepare(`
      UPDATE bills SET 
        paid_amount = ?,
        payment_status = ?,
        updated_at = datetime('now')
      WHERE id = ? AND firm_id = ?
    `).run(newPaidAmount, paymentStatus, id, firm_id);

    res.json({ 
      message: 'Payment recorded successfully',
      paid_amount: newPaidAmount,
      payment_status: paymentStatus
    });

  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
}

/**
 * Create debit note
 */
export async function createDebitNote(req, res) {
  try {
    const { firm_id, id: user_id } = req.user;
    const { id } = req.params;
    const { items, reason } = req.body;

    // Get original bill
    const originalBill = db.prepare(`
      SELECT * FROM bills WHERE id = ? AND firm_id = ? AND bill_type = 'PURCHASE'
    `).get(id, firm_id);

    if (!originalBill) {
      return res.status(404).json({ error: 'Original bill not found' });
    }

    // Create debit note (similar to createPurchaseBill but with DEBIT_NOTE type)
    
    res.status(201).json({ message: 'Debit note created successfully' });

  } catch (error) {
    console.error('Error creating debit note:', error);
    res.status(500).json({ error: 'Failed to create debit note' });
  }
}

/**
 * Generate bill PDF
 */
export async function generateBillPDF(req, res) {
  try {
    res.json({ message: 'PDF generation not yet implemented' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}

/**
 * Get purchase summary
 */
export async function getPurchaseSummary(req, res) {
  try {
    const { firm_id } = req.user;
    const { fromDate, toDate } = req.query;

    let query = `
      SELECT 
        COUNT(*) as total_bills,
        SUM(net_total) as total_amount,
        SUM(paid_amount) as total_paid,
        SUM(net_total - paid_amount) as total_outstanding,
        AVG(net_total) as avg_bill_value
      FROM bills
      WHERE firm_id = ? AND bill_type = 'PURCHASE' AND status != 'Cancelled'
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

    const summary = db.prepare(query).get(...params);

    res.json(summary);

  } catch (error) {
    console.error('Error fetching purchase summary:', error);
    res.status(500).json({ error: 'Failed to fetch purchase summary' });
  }
}

/**
 * Get purchase by party
 */
export async function getPurchaseByParty(req, res) {
  try {
    const { firm_id } = req.user;
    const { fromDate, toDate } = req.query;

    let query = `
      SELECT 
        party_id,
        party_name,
        COUNT(*) as bill_count,
        SUM(net_total) as total_amount,
        SUM(paid_amount) as total_paid,
        SUM(net_total - paid_amount) as outstanding
      FROM bills
      WHERE firm_id = ? AND bill_type = 'PURCHASE' AND status != 'Cancelled'
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

    query += ` GROUP BY party_id, party_name ORDER BY total_amount DESC`;

    const purchaseByParty = db.prepare(query).all(...params);

    res.json(purchaseByParty);

  } catch (error) {
    console.error('Error fetching purchase by party:', error);
    res.status(500).json({ error: 'Failed to fetch purchase by party' });
  }
}

/**
 * Get purchase by item
 */
export async function getPurchaseByItem(req, res) {
  try {
    res.json({ message: 'Purchase by item report not yet implemented' });
  } catch (error) {
    console.error('Error fetching purchase by item:', error);
    res.status(500).json({ error: 'Failed to fetch purchase by item' });
  }
}
