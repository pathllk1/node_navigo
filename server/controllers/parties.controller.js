/**
 * Parties Controller
 * Handles customer/supplier management operations
 */

import { db } from '../utils/db.js';
import { getStateCode, validateGSTIN, getStateCodeFromGSTIN } from '../utils/gstCalculator.js';

/**
 * Get all parties for a firm
 */
export async function getAllParties(req, res) {
  try {
    const { firm_id, role } = req.user;
    
    if (!firm_id && role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. No firm assigned.' });
    }

    const { 
      type, 
      status = 'Active', 
      page = 1, 
      limit = 50,
      sortBy = 'party_name',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (page - 1) * limit;
    
    let query = `
      SELECT p.*, 
             COUNT(DISTINCT pg.id) as gst_count,
             (SELECT gstin FROM party_gsts WHERE party_id = p.id AND is_default = 1 LIMIT 1) as default_gstin
      FROM parties p
      LEFT JOIN party_gsts pg ON pg.party_id = p.id
      WHERE p.firm_id = ?
    `;
    
    const params = [firm_id];
    
    if (type && type !== 'ALL') {
      query += ` AND (p.party_type = ? OR p.party_type = 'BOTH')`;
      params.push(type);
    }
    
    if (status !== 'ALL') {
      query += ` AND p.status = ?`;
      params.push(status);
    }
    
    query += ` GROUP BY p.id`;
    query += ` ORDER BY ${sortBy} ${sortOrder}`;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    
    const parties = db.prepare(query).all(...params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM parties WHERE firm_id = ?`;
    const countParams = [firm_id];
    
    if (type && type !== 'ALL') {
      countQuery += ` AND (party_type = ? OR party_type = 'BOTH')`;
      countParams.push(type);
    }
    
    if (status !== 'ALL') {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }
    
    const { total } = db.prepare(countQuery).get(...countParams);
    
    res.json({
      parties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching parties:', error);
    res.status(500).json({ error: 'Failed to fetch parties' });
  }
}

/**
 * Get party by ID
 */
export async function getPartyById(req, res) {
  try {
    const { firm_id, role } = req.user;
    const { id } = req.params;
    
    if (!firm_id && role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. No firm assigned.' });
    }

    const party = db.prepare(`
      SELECT p.*,
             (SELECT COUNT(*) FROM party_gsts WHERE party_id = p.id) as gst_count
      FROM parties p
      WHERE p.id = ? AND p.firm_id = ?
    `).get(id, firm_id);
    
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }
    
    // Get all GST numbers
    const gsts = db.prepare(`
      SELECT * FROM party_gsts WHERE party_id = ? ORDER BY is_default DESC, created_at
    `).all(id);
    
    party.gsts = gsts;
    
    res.json(party);
    
  } catch (error) {
    console.error('Error fetching party:', error);
    res.status(500).json({ error: 'Failed to fetch party' });
  }
}

/**
 * Create new party
 */
export async function createParty(req, res) {
  try {
    const { firm_id, id: user_id, role } = req.user;
    
    if (!firm_id && role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. No firm assigned.' });
    }

    const {
      party_name,
      party_type = 'CUSTOMER',
      contact_person,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      pan,
      opening_balance = 0,
      balance_type = 'Dr',
      credit_limit = 0,
      credit_days = 0,
      gsts = []
    } = req.body;

    // Validation
    if (!party_name) {
      return res.status(400).json({ error: 'Party name is required' });
    }

    // Check for duplicate party name in firm
    const existing = db.prepare(`
      SELECT id FROM parties WHERE firm_id = ? AND LOWER(party_name) = LOWER(?)
    `).get(firm_id, party_name);
    
    if (existing) {
      return res.status(400).json({ error: 'Party with this name already exists' });
    }

    // Get state code
    const state_code = state ? getStateCode(state) : null;

    // Insert party
    const result = db.transaction(() => {
      const partyResult = db.prepare(`
        INSERT INTO parties (
          firm_id, party_name, party_type, contact_person, phone, email,
          address, city, state, state_code, pincode, pan,
          opening_balance, balance_type, credit_limit, credit_days
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        firm_id, party_name, party_type, contact_person, phone, email,
        address, city, state, state_code, pincode, pan,
        opening_balance, balance_type, credit_limit, credit_days
      );

      const partyId = partyResult.lastInsertRowid;

      // Insert GST numbers
      if (gsts && gsts.length > 0) {
        const gstStmt = db.prepare(`
          INSERT INTO party_gsts (party_id, gstin, state, state_code, address, is_default)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        gsts.forEach((gst, index) => {
          if (gst.gstin && validateGSTIN(gst.gstin)) {
            const gstStateCode = getStateCodeFromGSTIN(gst.gstin);
            gstStmt.run(
              partyId,
              gst.gstin,
              gst.state || state,
              gstStateCode || state_code,
              gst.address || address,
              index === 0 ? 1 : 0 // First GST is default
            );
          }
        });
      }

      return partyId;
    })();

    res.status(201).json({
      message: 'Party created successfully',
      partyId: result
    });

  } catch (error) {
    console.error('Error creating party:', error);
    res.status(500).json({ error: 'Failed to create party' });
  }
}

/**
 * Update party
 */
export async function updateParty(req, res) {
  try {
    const { firm_id, role } = req.user;
    const { id } = req.params;
    
    if (!firm_id && role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. No firm assigned.' });
    }

    const {
      party_name,
      party_type,
      contact_person,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      pan,
      opening_balance,
      balance_type,
      credit_limit,
      credit_days,
      status
    } = req.body;

    // Check if party exists
    const existing = db.prepare(`
      SELECT id FROM parties WHERE id = ? AND firm_id = ?
    `).get(id, firm_id);
    
    if (!existing) {
      return res.status(404).json({ error: 'Party not found' });
    }

    // Get state code
    const state_code = state ? getStateCode(state) : null;

    // Update party
    db.prepare(`
      UPDATE parties SET
        party_name = COALESCE(?, party_name),
        party_type = COALESCE(?, party_type),
        contact_person = COALESCE(?, contact_person),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        state_code = COALESCE(?, state_code),
        pincode = COALESCE(?, pincode),
        pan = COALESCE(?, pan),
        opening_balance = COALESCE(?, opening_balance),
        balance_type = COALESCE(?, balance_type),
        credit_limit = COALESCE(?, credit_limit),
        credit_days = COALESCE(?, credit_days),
        status = COALESCE(?, status),
        updated_at = datetime('now')
      WHERE id = ? AND firm_id = ?
    `).run(
      party_name, party_type, contact_person, phone, email,
      address, city, state, state_code, pincode, pan,
      opening_balance, balance_type, credit_limit, credit_days, status,
      id, firm_id
    );

    res.json({ message: 'Party updated successfully' });

  } catch (error) {
    console.error('Error updating party:', error);
    res.status(500).json({ error: 'Failed to update party' });
  }
}

/**
 * Delete party
 */
export async function deleteParty(req, res) {
  try {
    const { firm_id, role } = req.user;
    const { id } = req.params;
    
    if (!firm_id && role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. No firm assigned.' });
    }

    // Check if party has any bills
    const billCount = db.prepare(`
      SELECT COUNT(*) as count FROM bills WHERE party_id = ? AND firm_id = ?
    `).get(id, firm_id);
    
    if (billCount.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete party with existing bills. Please mark as inactive instead.' 
      });
    }

    // Delete party (will cascade delete GSTs)
    const result = db.prepare(`
      DELETE FROM parties WHERE id = ? AND firm_id = ?
    `).run(id, firm_id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Party not found' });
    }

    res.json({ message: 'Party deleted successfully' });

  } catch (error) {
    console.error('Error deleting party:', error);
    res.status(500).json({ error: 'Failed to delete party' });
  }
}

/**
 * Get party GST numbers
 */
export async function getPartyGSTs(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;

    const gsts = db.prepare(`
      SELECT pg.* FROM party_gsts pg
      JOIN parties p ON p.id = pg.party_id
      WHERE pg.party_id = ? AND p.firm_id = ?
      ORDER BY pg.is_default DESC, pg.created_at
    `).all(id, firm_id);

    res.json(gsts);

  } catch (error) {
    console.error('Error fetching party GSTs:', error);
    res.status(500).json({ error: 'Failed to fetch party GSTs' });
  }
}

/**
 * Add party GST
 */
export async function addPartyGST(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;
    const { gstin, state, address, is_default } = req.body;

    if (!gstin || !validateGSTIN(gstin)) {
      return res.status(400).json({ error: 'Invalid GSTIN' });
    }

    // Verify party belongs to firm
    const party = db.prepare(`
      SELECT id FROM parties WHERE id = ? AND firm_id = ?
    `).get(id, firm_id);

    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }

    const state_code = getStateCodeFromGSTIN(gstin);

    db.transaction(() => {
      // If this is default, unset other defaults
      if (is_default) {
        db.prepare(`
          UPDATE party_gsts SET is_default = 0 WHERE party_id = ?
        `).run(id);
      }

      db.prepare(`
        INSERT INTO party_gsts (party_id, gstin, state, state_code, address, is_default)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, gstin, state, state_code, address, is_default ? 1 : 0);
    })();

    res.status(201).json({ message: 'GST added successfully' });

  } catch (error) {
    console.error('Error adding party GST:', error);
    res.status(500).json({ error: 'Failed to add party GST' });
  }
}

/**
 * Update party GST
 */
export async function updatePartyGST(req, res) {
  try {
    const { firm_id } = req.user;
    const { id, gstId } = req.params;
    const { gstin, state, address, is_default } = req.body;

    if (gstin && !validateGSTIN(gstin)) {
      return res.status(400).json({ error: 'Invalid GSTIN' });
    }

    db.transaction(() => {
      // If this is default, unset other defaults
      if (is_default) {
        db.prepare(`
          UPDATE party_gsts SET is_default = 0 WHERE party_id = ?
        `).run(id);
      }

      const state_code = gstin ? getStateCodeFromGSTIN(gstin) : null;

      db.prepare(`
        UPDATE party_gsts SET
          gstin = COALESCE(?, gstin),
          state = COALESCE(?, state),
          state_code = COALESCE(?, state_code),
          address = COALESCE(?, address),
          is_default = COALESCE(?, is_default)
        WHERE id = ? AND party_id = ?
      `).run(gstin, state, state_code, address, is_default ? 1 : 0, gstId, id);
    })();

    res.json({ message: 'GST updated successfully' });

  } catch (error) {
    console.error('Error updating party GST:', error);
    res.status(500).json({ error: 'Failed to update party GST' });
  }
}

/**
 * Delete party GST
 */
export async function deletePartyGST(req, res) {
  try {
    const { id, gstId } = req.params;

    const result = db.prepare(`
      DELETE FROM party_gsts WHERE id = ? AND party_id = ?
    `).run(gstId, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'GST not found' });
    }

    res.json({ message: 'GST deleted successfully' });

  } catch (error) {
    console.error('Error deleting party GST:', error);
    res.status(500).json({ error: 'Failed to delete party GST' });
  }
}

/**
 * Get party ledger
 */
export async function getPartyLedger(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;
    const { fromDate, toDate } = req.query;

    // Get party details
    const party = db.prepare(`
      SELECT * FROM parties WHERE id = ? AND firm_id = ?
    `).get(id, firm_id);

    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }

    // Get ledger entries
    let query = `
      SELECT * FROM ledger
      WHERE firm_id = ? AND account_name = ?
    `;
    const params = [firm_id, party.party_name];

    if (fromDate) {
      query += ` AND entry_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND entry_date <= ?`;
      params.push(toDate);
    }

    query += ` ORDER BY entry_date, id`;

    const entries = db.prepare(query).all(...params);

    // Calculate running balance
    let balance = party.opening_balance * (party.balance_type === 'Dr' ? 1 : -1);
    const entriesWithBalance = entries.map(entry => {
      balance += entry.debit - entry.credit;
      return {
        ...entry,
        balance: Math.abs(balance),
        balance_type: balance >= 0 ? 'Dr' : 'Cr'
      };
    });

    res.json({
      party,
      entries: entriesWithBalance,
      opening_balance: party.opening_balance,
      opening_balance_type: party.balance_type,
      closing_balance: Math.abs(balance),
      closing_balance_type: balance >= 0 ? 'Dr' : 'Cr'
    });

  } catch (error) {
    console.error('Error fetching party ledger:', error);
    res.status(500).json({ error: 'Failed to fetch party ledger' });
  }
}

/**
 * Get party balance
 */
export async function getPartyBalance(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;

    const party = db.prepare(`
      SELECT * FROM parties WHERE id = ? AND firm_id = ?
    `).get(id, firm_id);

    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }

    // Calculate current balance from ledger
    const ledgerBalance = db.prepare(`
      SELECT 
        SUM(debit) as total_debit,
        SUM(credit) as total_credit
      FROM ledger
      WHERE firm_id = ? AND account_name = ?
    `).get(firm_id, party.party_name);

    const opening = party.opening_balance * (party.balance_type === 'Dr' ? 1 : -1);
    const balance = opening + (ledgerBalance.total_debit || 0) - (ledgerBalance.total_credit || 0);

    res.json({
      party_id: party.id,
      party_name: party.party_name,
      opening_balance: party.opening_balance,
      opening_balance_type: party.balance_type,
      current_balance: Math.abs(balance),
      current_balance_type: balance >= 0 ? 'Dr' : 'Cr',
      total_debit: ledgerBalance.total_debit || 0,
      total_credit: ledgerBalance.total_credit || 0
    });

  } catch (error) {
    console.error('Error fetching party balance:', error);
    res.status(500).json({ error: 'Failed to fetch party balance' });
  }
}

/**
 * Get party bills
 */
export async function getPartyBills(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;
    const { bill_type, status, fromDate, toDate } = req.query;

    let query = `
      SELECT * FROM bills
      WHERE firm_id = ? AND party_id = ?
    `;
    const params = [firm_id, id];

    if (bill_type) {
      query += ` AND bill_type = ?`;
      params.push(bill_type);
    }

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (fromDate) {
      query += ` AND bill_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND bill_date <= ?`;
      params.push(toDate);
    }

    query += ` ORDER BY bill_date DESC, id DESC`;

    const bills = db.prepare(query).all(...params);

    res.json(bills);

  } catch (error) {
    console.error('Error fetching party bills:', error);
    res.status(500).json({ error: 'Failed to fetch party bills' });
  }
}

/**
 * Get party outstanding
 */
export async function getPartyOutstanding(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;

    const outstanding = db.prepare(`
      SELECT 
        bill_no,
        bill_date,
        due_date,
        net_total,
        paid_amount,
        (net_total - paid_amount) as outstanding_amount,
        CAST((julianday('now') - julianday(due_date)) AS INTEGER) as days_overdue
      FROM bills
      WHERE firm_id = ? AND party_id = ? 
        AND payment_status != 'Paid'
        AND status != 'Cancelled'
      ORDER BY due_date
    `).all(firm_id, id);

    const total_outstanding = outstanding.reduce((sum, bill) => sum + bill.outstanding_amount, 0);

    res.json({
      bills: outstanding,
      total_outstanding,
      count: outstanding.length
    });

  } catch (error) {
    console.error('Error fetching party outstanding:', error);
    res.status(500).json({ error: 'Failed to fetch party outstanding' });
  }
}

/**
 * Search parties
 */
export async function searchParties(req, res) {
  try {
    const { firm_id } = req.user;
    const { query } = req.params;

    const parties = db.prepare(`
      SELECT p.*, 
             (SELECT gstin FROM party_gsts WHERE party_id = p.id AND is_default = 1 LIMIT 1) as default_gstin
      FROM parties p
      WHERE p.firm_id = ? 
        AND p.status = 'Active'
        AND (
          LOWER(p.party_name) LIKE LOWER(?) OR
          LOWER(p.phone) LIKE LOWER(?) OR
          LOWER(p.email) LIKE LOWER(?)
        )
      ORDER BY p.party_name
      LIMIT 20
    `).all(firm_id, `%${query}%`, `%${query}%`, `%${query}%`);

    res.json(parties);

  } catch (error) {
    console.error('Error searching parties:', error);
    res.status(500).json({ error: 'Failed to search parties' });
  }
}

/**
 * Import parties (CSV/JSON)
 */
export async function importParties(req, res) {
  try {
    const { firm_id } = req.user;
    const { parties } = req.body;

    if (!Array.isArray(parties) || parties.length === 0) {
      return res.status(400).json({ error: 'Invalid parties data' });
    }

    let imported = 0;
    let failed = 0;
    const errors = [];

    db.transaction(() => {
      parties.forEach((party, index) => {
        try {
          const state_code = party.state ? getStateCode(party.state) : null;

          db.prepare(`
            INSERT INTO parties (
              firm_id, party_name, party_type, contact_person, phone, email,
              address, city, state, state_code, pincode, pan,
              opening_balance, balance_type, credit_limit, credit_days
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            firm_id,
            party.party_name,
            party.party_type || 'CUSTOMER',
            party.contact_person,
            party.phone,
            party.email,
            party.address,
            party.city,
            party.state,
            state_code,
            party.pincode,
            party.pan,
            party.opening_balance || 0,
            party.balance_type || 'Dr',
            party.credit_limit || 0,
            party.credit_days || 0
          );

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
      errors: errors.slice(0, 10) // Return first 10 errors
    });

  } catch (error) {
    console.error('Error importing parties:', error);
    res.status(500).json({ error: 'Failed to import parties' });
  }
}

/**
 * Export parties (CSV/JSON)
 */
export async function exportParties(req, res) {
  try {
    const { firm_id } = req.user;
    const { format = 'json' } = req.query;

    const parties = db.prepare(`
      SELECT p.*,
             (SELECT gstin FROM party_gsts WHERE party_id = p.id AND is_default = 1 LIMIT 1) as default_gstin
      FROM parties p
      WHERE p.firm_id = ?
      ORDER BY p.party_name
    `).all(firm_id);

    if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(parties[0] || {}).join(',');
      const rows = parties.map(p => Object.values(p).join(',')).join('\n');
      const csv = `${headers}\n${rows}`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=parties.csv');
      res.send(csv);
    } else {
      res.json(parties);
    }

  } catch (error) {
    console.error('Error exporting parties:', error);
    res.status(500).json({ error: 'Failed to export parties' });
  }
}
