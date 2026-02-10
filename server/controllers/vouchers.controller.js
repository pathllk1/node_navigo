/**
 * Vouchers Controller
 * Handles payment vouchers, receipt vouchers, and journal vouchers
 */

import { db } from '../utils/db.js';
import { getNextVoucherNumber } from '../utils/billNumberGenerator.js';
import { postVoucherToLedger, reverseLedgerEntries } from '../utils/ledgerHelper.js';

/**
 * Get all payment vouchers
 */
export async function getPaymentVouchers(req, res) {
  try {
    const { firm_id, role } = req.user;
    
    if (!firm_id && role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. No firm assigned.' });
    }

    const { fromDate, toDate, paid_to_account, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM vouchers
      WHERE firm_id = ? AND voucher_type = 'PAYMENT'
    `;
    const params = [firm_id];

    if (fromDate) {
      query += ` AND voucher_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND voucher_date <= ?`;
      params.push(toDate);
    }

    if (paid_to_account) {
      query += ` AND paid_to_account = ?`;
      params.push(paid_to_account);
    }

    query += ` ORDER BY voucher_date DESC, id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const vouchers = db.prepare(query).all(...params);

    res.json(vouchers);

  } catch (error) {
    console.error('Error fetching payment vouchers:', error);
    res.status(500).json({ error: 'Failed to fetch payment vouchers' });
  }
}

/**
 * Get payment voucher by ID
 */
export async function getPaymentVoucherById(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;

    const voucher = db.prepare(`
      SELECT * FROM vouchers
      WHERE id = ? AND firm_id = ? AND voucher_type = 'PAYMENT'
    `).get(id, firm_id);

    if (!voucher) {
      return res.status(404).json({ error: 'Payment voucher not found' });
    }

    res.json(voucher);

  } catch (error) {
    console.error('Error fetching payment voucher:', error);
    res.status(500).json({ error: 'Failed to fetch payment voucher' });
  }
}

/**
 * Create payment voucher
 */
export async function createPaymentVoucher(req, res) {
  try {
    const { firm_id, id: user_id } = req.user;
    const {
      voucher_date,
      paid_from_account,
      paid_from_type = 'BANK',
      paid_to_account,
      paid_to_type = 'EXPENSES',
      amount,
      narration,
      ref_no,
      ref_date
    } = req.body;

    // Validation
    if (!voucher_date || !paid_from_account || !paid_to_account || !amount) {
      return res.status(400).json({ 
        error: 'Voucher date, paid from account, paid to account, and amount are required' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Generate voucher number
    const voucherNo = getNextVoucherNumber(firm_id, 'PAYMENT');

    // Create voucher
    const result = db.transaction(() => {
      const voucherResult = db.prepare(`
        INSERT INTO vouchers (
          firm_id, voucher_type, voucher_no, voucher_date,
          paid_from_account, paid_from_type,
          paid_to_account, paid_to_type,
          amount, narration, ref_no, ref_date,
          created_by
        ) VALUES (?, 'PAYMENT', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        firm_id, voucherNo, voucher_date,
        paid_from_account, paid_from_type,
        paid_to_account, paid_to_type,
        amount, narration || '', ref_no || null, ref_date || null,
        user_id
      );

      const voucherId = voucherResult.lastInsertRowid;

      // Get voucher for ledger posting
      const voucher = db.prepare(`SELECT * FROM vouchers WHERE id = ?`).get(voucherId);

      // Post to ledger
      postVoucherToLedger(voucher);

      return { voucherId, voucherNo };
    })();

    res.status(201).json({
      message: 'Payment voucher created successfully',
      voucherId: result.voucherId,
      voucherNo: result.voucherNo
    });

  } catch (error) {
    console.error('Error creating payment voucher:', error);
    res.status(500).json({ error: 'Failed to create payment voucher' });
  }
}

/**
 * Update payment voucher
 */
export async function updatePaymentVoucher(req, res) {
  try {
    const { firm_id, id: user_id } = req.user;
    const { id } = req.params;
    const {
      voucher_date,
      paid_from_account,
      paid_from_type,
      paid_to_account,
      paid_to_type,
      amount,
      narration,
      ref_no,
      ref_date
    } = req.body;

    // Check if voucher exists
    const existing = db.prepare(`
      SELECT * FROM vouchers WHERE id = ? AND firm_id = ? AND voucher_type = 'PAYMENT'
    `).get(id, firm_id);

    if (!existing) {
      return res.status(404).json({ error: 'Payment voucher not found' });
    }

    // Validation
    if (amount && amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Update voucher
    db.transaction(() => {
      // Reverse old ledger entries
      reverseLedgerEntries('VOUCHER', id);

      // Update voucher
      db.prepare(`
        UPDATE vouchers SET
          voucher_date = COALESCE(?, voucher_date),
          paid_from_account = COALESCE(?, paid_from_account),
          paid_from_type = COALESCE(?, paid_from_type),
          paid_to_account = COALESCE(?, paid_to_account),
          paid_to_type = COALESCE(?, paid_to_type),
          amount = COALESCE(?, amount),
          narration = COALESCE(?, narration),
          ref_no = COALESCE(?, ref_no),
          ref_date = COALESCE(?, ref_date),
          updated_at = datetime('now')
        WHERE id = ? AND firm_id = ?
      `).run(
        voucher_date, paid_from_account, paid_from_type,
        paid_to_account, paid_to_type, amount, narration,
        ref_no, ref_date, id, firm_id
      );

      // Get updated voucher
      const voucher = db.prepare(`SELECT * FROM vouchers WHERE id = ?`).get(id);

      // Post new ledger entries
      postVoucherToLedger(voucher);
    })();

    res.json({ message: 'Payment voucher updated successfully' });

  } catch (error) {
    console.error('Error updating payment voucher:', error);
    res.status(500).json({ error: 'Failed to update payment voucher' });
  }
}

/**
 * Delete payment voucher
 */
export async function deletePaymentVoucher(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;

    const voucher = db.prepare(`
      SELECT * FROM vouchers WHERE id = ? AND firm_id = ? AND voucher_type = 'PAYMENT'
    `).get(id, firm_id);

    if (!voucher) {
      return res.status(404).json({ error: 'Payment voucher not found' });
    }

    db.transaction(() => {
      // Reverse ledger entries
      reverseLedgerEntries('VOUCHER', id);

      // Delete voucher
      db.prepare(`DELETE FROM vouchers WHERE id = ? AND firm_id = ?`).run(id, firm_id);
    })();

    res.json({ message: 'Payment voucher deleted successfully' });

  } catch (error) {
    console.error('Error deleting payment voucher:', error);
    res.status(500).json({ error: 'Failed to delete payment voucher' });
  }
}

/**
 * Get all receipt vouchers
 */
export async function getReceiptVouchers(req, res) {
  try {
    const { firm_id, role } = req.user;
    
    if (!firm_id && role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. No firm assigned.' });
    }

    const { fromDate, toDate, received_from_account, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM vouchers
      WHERE firm_id = ? AND voucher_type = 'RECEIPT'
    `;
    const params = [firm_id];

    if (fromDate) {
      query += ` AND voucher_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND voucher_date <= ?`;
      params.push(toDate);
    }

    if (received_from_account) {
      query += ` AND received_from_account = ?`;
      params.push(received_from_account);
    }

    query += ` ORDER BY voucher_date DESC, id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const vouchers = db.prepare(query).all(...params);

    res.json(vouchers);

  } catch (error) {
    console.error('Error fetching receipt vouchers:', error);
    res.status(500).json({ error: 'Failed to fetch receipt vouchers' });
  }
}

/**
 * Get receipt voucher by ID
 */
export async function getReceiptVoucherById(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;

    const voucher = db.prepare(`
      SELECT * FROM vouchers
      WHERE id = ? AND firm_id = ? AND voucher_type = 'RECEIPT'
    `).get(id, firm_id);

    if (!voucher) {
      return res.status(404).json({ error: 'Receipt voucher not found' });
    }

    res.json(voucher);

  } catch (error) {
    console.error('Error fetching receipt voucher:', error);
    res.status(500).json({ error: 'Failed to fetch receipt voucher' });
  }
}

/**
 * Create receipt voucher
 */
export async function createReceiptVoucher(req, res) {
  try {
    const { firm_id, id: user_id } = req.user;
    const {
      voucher_date,
      received_in_account,
      received_in_type = 'BANK',
      received_from_account,
      received_from_type = 'INCOME',
      amount,
      narration,
      ref_no,
      ref_date
    } = req.body;

    // Validation
    if (!voucher_date || !received_in_account || !received_from_account || !amount) {
      return res.status(400).json({ 
        error: 'Voucher date, received in account, received from account, and amount are required' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Generate voucher number
    const voucherNo = getNextVoucherNumber(firm_id, 'RECEIPT');

    // Create voucher
    const result = db.transaction(() => {
      const voucherResult = db.prepare(`
        INSERT INTO vouchers (
          firm_id, voucher_type, voucher_no, voucher_date,
          received_in_account, received_in_type,
          received_from_account, received_from_type,
          amount, narration, ref_no, ref_date,
          created_by
        ) VALUES (?, 'RECEIPT', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        firm_id, voucherNo, voucher_date,
        received_in_account, received_in_type,
        received_from_account, received_from_type,
        amount, narration || '', ref_no || null, ref_date || null,
        user_id
      );

      const voucherId = voucherResult.lastInsertRowid;

      // Get voucher for ledger posting
      const voucher = db.prepare(`SELECT * FROM vouchers WHERE id = ?`).get(voucherId);

      // Post to ledger
      postVoucherToLedger(voucher);

      return { voucherId, voucherNo };
    })();

    res.status(201).json({
      message: 'Receipt voucher created successfully',
      voucherId: result.voucherId,
      voucherNo: result.voucherNo
    });

  } catch (error) {
    console.error('Error creating receipt voucher:', error);
    res.status(500).json({ error: 'Failed to create receipt voucher' });
  }
}

/**
 * Update receipt voucher
 */
export async function updateReceiptVoucher(req, res) {
  try {
    const { firm_id, id: user_id } = req.user;
    const { id } = req.params;
    const {
      voucher_date,
      received_in_account,
      received_in_type,
      received_from_account,
      received_from_type,
      amount,
      narration,
      ref_no,
      ref_date
    } = req.body;

    // Check if voucher exists
    const existing = db.prepare(`
      SELECT * FROM vouchers WHERE id = ? AND firm_id = ? AND voucher_type = 'RECEIPT'
    `).get(id, firm_id);

    if (!existing) {
      return res.status(404).json({ error: 'Receipt voucher not found' });
    }

    // Validation
    if (amount && amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Update voucher
    db.transaction(() => {
      // Reverse old ledger entries
      reverseLedgerEntries('VOUCHER', id);

      // Update voucher
      db.prepare(`
        UPDATE vouchers SET
          voucher_date = COALESCE(?, voucher_date),
          received_in_account = COALESCE(?, received_in_account),
          received_in_type = COALESCE(?, received_in_type),
          received_from_account = COALESCE(?, received_from_account),
          received_from_type = COALESCE(?, received_from_type),
          amount = COALESCE(?, amount),
          narration = COALESCE(?, narration),
          ref_no = COALESCE(?, ref_no),
          ref_date = COALESCE(?, ref_date),
          updated_at = datetime('now')
        WHERE id = ? AND firm_id = ?
      `).run(
        voucher_date, received_in_account, received_in_type,
        received_from_account, received_from_type, amount, narration,
        ref_no, ref_date, id, firm_id
      );

      // Get updated voucher
      const voucher = db.prepare(`SELECT * FROM vouchers WHERE id = ?`).get(id);

      // Post new ledger entries
      postVoucherToLedger(voucher);
    })();

    res.json({ message: 'Receipt voucher updated successfully' });

  } catch (error) {
    console.error('Error updating receipt voucher:', error);
    res.status(500).json({ error: 'Failed to update receipt voucher' });
  }
}

/**
 * Delete receipt voucher
 */
export async function deleteReceiptVoucher(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;

    const voucher = db.prepare(`
      SELECT * FROM vouchers WHERE id = ? AND firm_id = ? AND voucher_type = 'RECEIPT'
    `).get(id, firm_id);

    if (!voucher) {
      return res.status(404).json({ error: 'Receipt voucher not found' });
    }

    db.transaction(() => {
      // Reverse ledger entries
      reverseLedgerEntries('VOUCHER', id);

      // Delete voucher
      db.prepare(`DELETE FROM vouchers WHERE id = ? AND firm_id = ?`).run(id, firm_id);
    })();

    res.json({ message: 'Receipt voucher deleted successfully' });

  } catch (error) {
    console.error('Error deleting receipt voucher:', error);
    res.status(500).json({ error: 'Failed to delete receipt voucher' });
  }
}

/**
 * Get all journal vouchers
 */
export async function getJournalVouchers(req, res) {
  try {
    const { firm_id, role } = req.user;
    
    if (!firm_id && role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. No firm assigned.' });
    }

    const { fromDate, toDate, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM vouchers
      WHERE firm_id = ? AND voucher_type = 'JOURNAL'
    `;
    const params = [firm_id];

    if (fromDate) {
      query += ` AND voucher_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND voucher_date <= ?`;
      params.push(toDate);
    }

    query += ` ORDER BY voucher_date DESC, id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const vouchers = db.prepare(query).all(...params);

    res.json(vouchers);

  } catch (error) {
    console.error('Error fetching journal vouchers:', error);
    res.status(500).json({ error: 'Failed to fetch journal vouchers' });
  }
}

/**
 * Get journal voucher by ID
 */
export async function getJournalVoucherById(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;

    const voucher = db.prepare(`
      SELECT * FROM vouchers
      WHERE id = ? AND firm_id = ? AND voucher_type = 'JOURNAL'
    `).get(id, firm_id);

    if (!voucher) {
      return res.status(404).json({ error: 'Journal voucher not found' });
    }

    res.json(voucher);

  } catch (error) {
    console.error('Error fetching journal voucher:', error);
    res.status(500).json({ error: 'Failed to fetch journal voucher' });
  }
}

/**
 * Create journal voucher
 */
export async function createJournalVoucher(req, res) {
  try {
    const { firm_id, id: user_id } = req.user;
    const {
      voucher_date,
      journal_entries,
      narration,
      ref_no,
      ref_date
    } = req.body;

    // Validation
    if (!voucher_date || !journal_entries || journal_entries.length === 0) {
      return res.status(400).json({ 
        error: 'Voucher date and journal entries are required' 
      });
    }

    // Validate double entry (total debit = total credit)
    const totalDebit = journal_entries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredit = journal_entries.reduce((sum, e) => sum + (e.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ 
        error: 'Total debit must equal total credit',
        totalDebit,
        totalCredit
      });
    }

    // Generate voucher number
    const voucherNo = getNextVoucherNumber(firm_id, 'JOURNAL');

    // Create voucher
    const result = db.transaction(() => {
      const voucherResult = db.prepare(`
        INSERT INTO vouchers (
          firm_id, voucher_type, voucher_no, voucher_date,
          amount, journal_entries, narration, ref_no, ref_date,
          created_by
        ) VALUES (?, 'JOURNAL', ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        firm_id, voucherNo, voucher_date,
        totalDebit, JSON.stringify(journal_entries),
        narration || '', ref_no || null, ref_date || null,
        user_id
      );

      const voucherId = voucherResult.lastInsertRowid;

      // Get voucher for ledger posting
      const voucher = db.prepare(`SELECT * FROM vouchers WHERE id = ?`).get(voucherId);

      // Post to ledger
      postVoucherToLedger(voucher);

      return { voucherId, voucherNo };
    })();

    res.status(201).json({
      message: 'Journal voucher created successfully',
      voucherId: result.voucherId,
      voucherNo: result.voucherNo
    });

  } catch (error) {
    console.error('Error creating journal voucher:', error);
    res.status(500).json({ error: 'Failed to create journal voucher' });
  }
}

/**
 * Update journal voucher
 */
export async function updateJournalVoucher(req, res) {
  try {
    const { firm_id, id: user_id } = req.user;
    const { id } = req.params;
    const {
      voucher_date,
      journal_entries,
      narration,
      ref_no,
      ref_date
    } = req.body;

    // Check if voucher exists
    const existing = db.prepare(`
      SELECT * FROM vouchers WHERE id = ? AND firm_id = ? AND voucher_type = 'JOURNAL'
    `).get(id, firm_id);

    if (!existing) {
      return res.status(404).json({ error: 'Journal voucher not found' });
    }

    // Validate double entry if journal_entries provided
    if (journal_entries) {
      const totalDebit = journal_entries.reduce((sum, e) => sum + (e.debit || 0), 0);
      const totalCredit = journal_entries.reduce((sum, e) => sum + (e.credit || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return res.status(400).json({ 
          error: 'Total debit must equal total credit',
          totalDebit,
          totalCredit
        });
      }
    }

    // Update voucher
    db.transaction(() => {
      // Reverse old ledger entries
      reverseLedgerEntries('VOUCHER', id);

      // Calculate new amount if journal_entries provided
      let amount = existing.amount;
      if (journal_entries) {
        amount = journal_entries.reduce((sum, e) => sum + (e.debit || 0), 0);
      }

      // Update voucher
      db.prepare(`
        UPDATE vouchers SET
          voucher_date = COALESCE(?, voucher_date),
          amount = ?,
          journal_entries = COALESCE(?, journal_entries),
          narration = COALESCE(?, narration),
          ref_no = COALESCE(?, ref_no),
          ref_date = COALESCE(?, ref_date),
          updated_at = datetime('now')
        WHERE id = ? AND firm_id = ?
      `).run(
        voucher_date, amount,
        journal_entries ? JSON.stringify(journal_entries) : null,
        narration, ref_no, ref_date, id, firm_id
      );

      // Get updated voucher
      const voucher = db.prepare(`SELECT * FROM vouchers WHERE id = ?`).get(id);

      // Post new ledger entries
      postVoucherToLedger(voucher);
    })();

    res.json({ message: 'Journal voucher updated successfully' });

  } catch (error) {
    console.error('Error updating journal voucher:', error);
    res.status(500).json({ error: 'Failed to update journal voucher' });
  }
}

/**
 * Delete journal voucher
 */
export async function deleteJournalVoucher(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;

    const voucher = db.prepare(`
      SELECT * FROM vouchers WHERE id = ? AND firm_id = ? AND voucher_type = 'JOURNAL'
    `).get(id, firm_id);

    if (!voucher) {
      return res.status(404).json({ error: 'Journal voucher not found' });
    }

    db.transaction(() => {
      // Reverse ledger entries
      reverseLedgerEntries('VOUCHER', id);

      // Delete voucher
      db.prepare(`DELETE FROM vouchers WHERE id = ? AND firm_id = ?`).run(id, firm_id);
    })();

    res.json({ message: 'Journal voucher deleted successfully' });

  } catch (error) {
    console.error('Error deleting journal voucher:', error);
    res.status(500).json({ error: 'Failed to delete journal voucher' });
  }
}

/**
 * Get all vouchers (combined)
 */
export async function getAllVouchers(req, res) {
  try {
    const { firm_id, role } = req.user;
    
    if (!firm_id && role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. No firm assigned.' });
    }

    const { 
      voucher_type, 
      fromDate, 
      toDate, 
      page = 1, 
      limit = 50 
    } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM vouchers WHERE firm_id = ?`;
    const params = [firm_id];

    if (voucher_type) {
      query += ` AND voucher_type = ?`;
      params.push(voucher_type);
    }

    if (fromDate) {
      query += ` AND voucher_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND voucher_date <= ?`;
      params.push(toDate);
    }

    query += ` ORDER BY voucher_date DESC, id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const vouchers = db.prepare(query).all(...params);

    res.json(vouchers);

  } catch (error) {
    console.error('Error fetching vouchers:', error);
    res.status(500).json({ error: 'Failed to fetch vouchers' });
  }
}

/**
 * Get vouchers summary
 */
export async function getVouchersSummary(req, res) {
  try {
    const { firm_id } = req.user;
    const { fromDate, toDate } = req.query;

    let query = `
      SELECT 
        voucher_type,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM vouchers
      WHERE firm_id = ?
    `;
    const params = [firm_id];

    if (fromDate) {
      query += ` AND voucher_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND voucher_date <= ?`;
      params.push(toDate);
    }

    query += ` GROUP BY voucher_type`;

    const summary = db.prepare(query).all(...params);

    res.json(summary);

  } catch (error) {
    console.error('Error fetching vouchers summary:', error);
    res.status(500).json({ error: 'Failed to fetch vouchers summary' });
  }
}

/**
 * Get vouchers by account
 */
export async function getVouchersByAccount(req, res) {
  try {
    const { firm_id } = req.user;
    const { account_name, fromDate, toDate } = req.query;

    if (!account_name) {
      return res.status(400).json({ error: 'Account name is required' });
    }

    let query = `
      SELECT * FROM vouchers
      WHERE firm_id = ?
        AND (
          paid_to_account = ? OR
          paid_from_account = ? OR
          received_from_account = ? OR
          received_in_account = ?
        )
    `;
    const params = [firm_id, account_name, account_name, account_name, account_name];

    if (fromDate) {
      query += ` AND voucher_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND voucher_date <= ?`;
      params.push(toDate);
    }

    query += ` ORDER BY voucher_date DESC, id DESC`;

    const vouchers = db.prepare(query).all(...params);

    res.json(vouchers);

  } catch (error) {
    console.error('Error fetching vouchers by account:', error);
    res.status(500).json({ error: 'Failed to fetch vouchers by account' });
  }
}
