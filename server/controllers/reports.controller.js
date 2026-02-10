/**
 * Reports Controller
 * Handles all business reports and analytics
 */

import { db } from '../utils/db.js';

/**
 * Get sales summary report
 */
export async function getSalesSummary(req, res) {
  try {
    const { firm_id } = req.user;
    const { fromDate, toDate } = req.query;

    let query = `
      SELECT 
        COUNT(*) as total_bills,
        SUM(gross_total) as gross_total,
        SUM(cgst + sgst + igst) as total_gst,
        SUM(net_total) as net_total,
        SUM(paid_amount) as total_paid,
        SUM(net_total - paid_amount) as total_outstanding,
        AVG(net_total) as avg_bill_value
      FROM bills
      WHERE firm_id = ? AND bill_type = 'SALES' AND status != 'CANCELLED'
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
    console.error('Error fetching sales summary:', error);
    res.status(500).json({ error: 'Failed to fetch sales summary' });
  }
}

/**
 * Get sales by party report
 */
export async function getSalesByParty(req, res) {
  try {
    const { firm_id } = req.user;
    const { fromDate, toDate } = req.query;

    let query = `
      SELECT 
        party_id,
        party_name,
        COUNT(*) as bill_count,
        SUM(net_total) as total_amount,
        SUM(paid_amount) as paid_amount,
        SUM(net_total - paid_amount) as outstanding
      FROM bills
      WHERE firm_id = ? AND bill_type = 'SALES' AND status != 'CANCELLED'
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

    const report = db.prepare(query).all(...params);

    res.json(report);

  } catch (error) {
    console.error('Error fetching sales by party:', error);
    res.status(500).json({ error: 'Failed to fetch sales by party' });
  }
}

/**
 * Get sales by item report
 */
export async function getSalesByItem(req, res) {
  try {
    const { firm_id } = req.user;
    const { fromDate, toDate } = req.query;

    let query = `
      SELECT 
        bi.item_name,
        SUM(bi.qty) as total_qty,
        SUM(bi.amount) as total_amount,
        AVG(bi.rate) as avg_rate,
        COUNT(DISTINCT bi.bill_id) as bill_count
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE b.firm_id = ? AND b.bill_type = 'SALES' AND b.status != 'CANCELLED'
    `;
    const params = [firm_id];

    if (fromDate) {
      query += ` AND b.bill_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND b.bill_date <= ?`;
      params.push(toDate);
    }

    query += ` GROUP BY bi.item_name ORDER BY total_amount DESC`;

    const report = db.prepare(query).all(...params);

    res.json(report);

  } catch (error) {
    console.error('Error fetching sales by item:', error);
    res.status(500).json({ error: 'Failed to fetch sales by item' });
  }
}

/**
 * Get sales by month report
 */
export async function getSalesByMonth(req, res) {
  try {
    const { firm_id } = req.user;
    const { year } = req.query;

    let query = `
      SELECT 
        strftime('%Y-%m', bill_date) as month,
        COUNT(*) as bill_count,
        SUM(net_total) as total_amount,
        SUM(paid_amount) as paid_amount
      FROM bills
      WHERE firm_id = ? AND bill_type = 'SALES' AND status != 'CANCELLED'
    `;
    const params = [firm_id];

    if (year) {
      query += ` AND strftime('%Y', bill_date) = ?`;
      params.push(year);
    }

    query += ` GROUP BY month ORDER BY month`;

    const report = db.prepare(query).all(...params);

    res.json(report);

  } catch (error) {
    console.error('Error fetching sales by month:', error);
    res.status(500).json({ error: 'Failed to fetch sales by month' });
  }
}

/**
 * Get sales outstanding report
 */
export async function getSalesOutstanding(req, res) {
  try {
    const { firm_id } = req.user;

    const report = db.prepare(`
      SELECT 
        party_id,
        party_name,
        bill_no,
        bill_date,
        due_date,
        net_total,
        paid_amount,
        (net_total - paid_amount) as outstanding,
        CASE 
          WHEN due_date < date('now') THEN 'OVERDUE'
          WHEN due_date = date('now') THEN 'DUE_TODAY'
          ELSE 'NOT_DUE'
        END as status
      FROM bills
      WHERE firm_id = ? AND bill_type = 'SALES' 
        AND status != 'CANCELLED'
        AND (net_total - paid_amount) > 0
      ORDER BY due_date
    `).all(firm_id);

    res.json(report);

  } catch (error) {
    console.error('Error fetching sales outstanding:', error);
    res.status(500).json({ error: 'Failed to fetch sales outstanding' });
  }
}

/**
 * Get purchase summary report
 */
export async function getPurchaseSummary(req, res) {
  try {
    const { firm_id } = req.user;
    const { fromDate, toDate } = req.query;

    let query = `
      SELECT 
        COUNT(*) as total_bills,
        SUM(gross_total) as gross_total,
        SUM(cgst + sgst + igst) as total_gst,
        SUM(net_total) as net_total,
        SUM(paid_amount) as total_paid,
        SUM(net_total - paid_amount) as total_outstanding,
        AVG(net_total) as avg_bill_value
      FROM bills
      WHERE firm_id = ? AND bill_type = 'PURCHASE' AND status != 'CANCELLED'
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
 * Get purchase by party report
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
        SUM(paid_amount) as paid_amount,
        SUM(net_total - paid_amount) as outstanding
      FROM bills
      WHERE firm_id = ? AND bill_type = 'PURCHASE' AND status != 'CANCELLED'
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

    const report = db.prepare(query).all(...params);

    res.json(report);

  } catch (error) {
    console.error('Error fetching purchase by party:', error);
    res.status(500).json({ error: 'Failed to fetch purchase by party' });
  }
}

/**
 * Get purchase by item report
 */
export async function getPurchaseByItem(req, res) {
  try {
    const { firm_id } = req.user;
    const { fromDate, toDate } = req.query;

    let query = `
      SELECT 
        bi.item_name,
        SUM(bi.qty) as total_qty,
        SUM(bi.amount) as total_amount,
        AVG(bi.rate) as avg_rate,
        COUNT(DISTINCT bi.bill_id) as bill_count
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE b.firm_id = ? AND b.bill_type = 'PURCHASE' AND b.status != 'CANCELLED'
    `;
    const params = [firm_id];

    if (fromDate) {
      query += ` AND b.bill_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND b.bill_date <= ?`;
      params.push(toDate);
    }

    query += ` GROUP BY bi.item_name ORDER BY total_amount DESC`;

    const report = db.prepare(query).all(...params);

    res.json(report);

  } catch (error) {
    console.error('Error fetching purchase by item:', error);
    res.status(500).json({ error: 'Failed to fetch purchase by item' });
  }
}

/**
 * Get purchase by month report
 */
export async function getPurchaseByMonth(req, res) {
  try {
    const { firm_id } = req.user;
    const { year } = req.query;

    let query = `
      SELECT 
        strftime('%Y-%m', bill_date) as month,
        COUNT(*) as bill_count,
        SUM(net_total) as total_amount,
        SUM(paid_amount) as paid_amount
      FROM bills
      WHERE firm_id = ? AND bill_type = 'PURCHASE' AND status != 'CANCELLED'
    `;
    const params = [firm_id];

    if (year) {
      query += ` AND strftime('%Y', bill_date) = ?`;
      params.push(year);
    }

    query += ` GROUP BY month ORDER BY month`;

    const report = db.prepare(query).all(...params);

    res.json(report);

  } catch (error) {
    console.error('Error fetching purchase by month:', error);
    res.status(500).json({ error: 'Failed to fetch purchase by month' });
  }
}

/**
 * Get purchase outstanding report
 */
export async function getPurchaseOutstanding(req, res) {
  try {
    const { firm_id } = req.user;

    const report = db.prepare(`
      SELECT 
        party_id,
        party_name,
        bill_no,
        bill_date,
        due_date,
        net_total,
        paid_amount,
        (net_total - paid_amount) as outstanding,
        CASE 
          WHEN due_date < date('now') THEN 'OVERDUE'
          WHEN due_date = date('now') THEN 'DUE_TODAY'
          ELSE 'NOT_DUE'
        END as status
      FROM bills
      WHERE firm_id = ? AND bill_type = 'PURCHASE' 
        AND status != 'CANCELLED'
        AND (net_total - paid_amount) > 0
      ORDER BY due_date
    `).all(firm_id);

    res.json(report);

  } catch (error) {
    console.error('Error fetching purchase outstanding:', error);
    res.status(500).json({ error: 'Failed to fetch purchase outstanding' });
  }
}

/**
 * Get stock summary report
 */
export async function getStockSummary(req, res) {
  try {
    const { firm_id } = req.user;

    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total_items,
        SUM(current_stock) as total_stock,
        SUM(current_stock * rate) as total_value,
        COUNT(CASE WHEN current_stock <= reorder_level THEN 1 END) as low_stock_items,
        COUNT(CASE WHEN current_stock = 0 THEN 1 END) as out_of_stock_items
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
 * Get stock valuation report
 */
export async function getStockValuation(req, res) {
  try {
    const { firm_id } = req.user;

    const report = db.prepare(`
      SELECT 
        item_name,
        hsn_code,
        unit,
        current_stock,
        rate,
        (current_stock * rate) as value
      FROM stocks
      WHERE firm_id = ? AND current_stock > 0
      ORDER BY value DESC
    `).all(firm_id);

    const total_value = report.reduce((sum, item) => sum + item.value, 0);

    res.json({
      items: report,
      total_value
    });

  } catch (error) {
    console.error('Error fetching stock valuation:', error);
    res.status(500).json({ error: 'Failed to fetch stock valuation' });
  }
}

/**
 * Get stock movements report
 */
export async function getStockMovements(req, res) {
  try {
    const { firm_id } = req.user;
    const { stock_id, fromDate, toDate } = req.query;

    let query = `
      SELECT sr.*, s.item_name
      FROM stock_reg sr
      JOIN stocks s ON sr.stock_id = s.id
      WHERE s.firm_id = ?
    `;
    const params = [firm_id];

    if (stock_id) {
      query += ` AND sr.stock_id = ?`;
      params.push(stock_id);
    }

    if (fromDate) {
      query += ` AND sr.movement_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND sr.movement_date <= ?`;
      params.push(toDate);
    }

    query += ` ORDER BY sr.movement_date DESC, sr.id DESC LIMIT 1000`;

    const movements = db.prepare(query).all(...params);

    res.json(movements);

  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({ error: 'Failed to fetch stock movements' });
  }
}

/**
 * Get low stock items report
 */
export async function getLowStockItems(req, res) {
  try {
    const { firm_id } = req.user;

    const report = db.prepare(`
      SELECT 
        item_name,
        hsn_code,
        unit,
        current_stock,
        reorder_level,
        (reorder_level - current_stock) as shortage
      FROM stocks
      WHERE firm_id = ? AND current_stock <= reorder_level
      ORDER BY shortage DESC
    `).all(firm_id);

    res.json(report);

  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
}

/**
 * Get stock aging report
 */
export async function getStockAging(req, res) {
  try {
    const { firm_id } = req.user;

    const report = db.prepare(`
      SELECT 
        s.item_name,
        s.current_stock,
        s.rate,
        (s.current_stock * s.rate) as value,
        sr.movement_date as last_movement_date,
        CAST((julianday('now') - julianday(sr.movement_date)) AS INTEGER) as days_since_movement
      FROM stocks s
      LEFT JOIN (
        SELECT stock_id, MAX(movement_date) as movement_date
        FROM stock_reg
        GROUP BY stock_id
      ) sr ON s.id = sr.stock_id
      WHERE s.firm_id = ? AND s.current_stock > 0
      ORDER BY days_since_movement DESC
    `).all(firm_id);

    res.json(report);

  } catch (error) {
    console.error('Error fetching stock aging:', error);
    res.status(500).json({ error: 'Failed to fetch stock aging' });
  }
}

/**
 * Get debtors report
 */
export async function getDebtorsReport(req, res) {
  try {
    const { firm_id } = req.user;

    const report = db.prepare(`
      SELECT 
        p.id,
        p.party_name,
        p.contact_person,
        p.phone,
        SUM(b.net_total - b.paid_amount) as outstanding
      FROM parties p
      JOIN bills b ON p.id = b.party_id
      WHERE p.firm_id = ? AND p.party_type = 'CUSTOMER'
        AND b.bill_type = 'SALES'
        AND b.status != 'CANCELLED'
        AND (b.net_total - b.paid_amount) > 0
      GROUP BY p.id, p.party_name, p.contact_person, p.phone
      ORDER BY outstanding DESC
    `).all(firm_id);

    const total_outstanding = report.reduce((sum, party) => sum + party.outstanding, 0);

    res.json({
      debtors: report,
      total_outstanding
    });

  } catch (error) {
    console.error('Error fetching debtors report:', error);
    res.status(500).json({ error: 'Failed to fetch debtors report' });
  }
}

/**
 * Get creditors report
 */
export async function getCreditorsReport(req, res) {
  try {
    const { firm_id } = req.user;

    const report = db.prepare(`
      SELECT 
        p.id,
        p.party_name,
        p.contact_person,
        p.phone,
        SUM(b.net_total - b.paid_amount) as outstanding
      FROM parties p
      JOIN bills b ON p.id = b.party_id
      WHERE p.firm_id = ? AND p.party_type = 'SUPPLIER'
        AND b.bill_type = 'PURCHASE'
        AND b.status != 'CANCELLED'
        AND (b.net_total - b.paid_amount) > 0
      GROUP BY p.id, p.party_name, p.contact_person, p.phone
      ORDER BY outstanding DESC
    `).all(firm_id);

    const total_outstanding = report.reduce((sum, party) => sum + party.outstanding, 0);

    res.json({
      creditors: report,
      total_outstanding
    });

  } catch (error) {
    console.error('Error fetching creditors report:', error);
    res.status(500).json({ error: 'Failed to fetch creditors report' });
  }
}

/**
 * Get party aging report
 */
export async function getPartyAging(req, res) {
  try {
    const { firm_id } = req.user;
    const { party_type } = req.query;

    let query = `
      SELECT 
        p.party_name,
        b.bill_no,
        b.bill_date,
        b.due_date,
        b.net_total,
        b.paid_amount,
        (b.net_total - b.paid_amount) as outstanding,
        CAST((julianday('now') - julianday(b.due_date)) AS INTEGER) as days_overdue
      FROM parties p
      JOIN bills b ON p.id = b.party_id
      WHERE p.firm_id = ?
        AND b.status != 'CANCELLED'
        AND (b.net_total - b.paid_amount) > 0
    `;
    const params = [firm_id];

    if (party_type) {
      query += ` AND p.party_type = ?`;
      params.push(party_type);
    }

    query += ` ORDER BY days_overdue DESC`;

    const report = db.prepare(query).all(...params);

    res.json(report);

  } catch (error) {
    console.error('Error fetching party aging:', error);
    res.status(500).json({ error: 'Failed to fetch party aging' });
  }
}

/**
 * Get party ledger
 */
export async function getPartyLedger(req, res) {
  try {
    const { firm_id } = req.user;
    const { partyId } = req.params;
    const { fromDate, toDate } = req.query;

    const party = db.prepare(`
      SELECT * FROM parties WHERE id = ? AND firm_id = ?
    `).get(partyId, firm_id);

    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }

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
    let balance = 0;
    const ledgerWithBalance = entries.map(entry => {
      balance += entry.debit - entry.credit;
      return {
        ...entry,
        balance: Math.abs(balance),
        balance_type: balance >= 0 ? 'Dr' : 'Cr'
      };
    });

    res.json({
      party,
      entries: ledgerWithBalance,
      closing_balance: Math.abs(balance),
      closing_balance_type: balance >= 0 ? 'Dr' : 'Cr'
    });

  } catch (error) {
    console.error('Error fetching party ledger:', error);
    res.status(500).json({ error: 'Failed to fetch party ledger' });
  }
}

/**
 * Get GST summary report
 */
export async function getGSTSummary(req, res) {
  try {
    const { firm_id } = req.user;
    const { fromDate, toDate } = req.query;

    let query = `
      SELECT 
        bill_type,
        SUM(cgst) as total_cgst,
        SUM(sgst) as total_sgst,
        SUM(igst) as total_igst,
        SUM(cgst + sgst + igst) as total_gst,
        SUM(gross_total) as taxable_value,
        COUNT(*) as bill_count
      FROM bills
      WHERE firm_id = ? AND status != 'CANCELLED'
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

    query += ` GROUP BY bill_type`;

    const summary = db.prepare(query).all(...params);

    res.json(summary);

  } catch (error) {
    console.error('Error fetching GST summary:', error);
    res.status(500).json({ error: 'Failed to fetch GST summary' });
  }
}

/**
 * Get GST sales report
 */
export async function getGSTSalesReport(req, res) {
  try {
    const { firm_id } = req.user;
    const { fromDate, toDate } = req.query;

    let query = `
      SELECT 
        bill_no,
        bill_date,
        party_name,
        party_gstin,
        gross_total as taxable_value,
        cgst,
        sgst,
        igst,
        (cgst + sgst + igst) as total_gst,
        net_total
      FROM bills
      WHERE firm_id = ? AND bill_type = 'SALES' AND status != 'CANCELLED'
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

    query += ` ORDER BY bill_date, bill_no`;

    const report = db.prepare(query).all(...params);

    res.json(report);

  } catch (error) {
    console.error('Error fetching GST sales report:', error);
    res.status(500).json({ error: 'Failed to fetch GST sales report' });
  }
}

/**
 * Get GST purchase report
 */
export async function getGSTPurchaseReport(req, res) {
  try {
    const { firm_id } = req.user;
    const { fromDate, toDate } = req.query;

    let query = `
      SELECT 
        bill_no,
        bill_date,
        party_name,
        party_gstin,
        gross_total as taxable_value,
        cgst,
        sgst,
        igst,
        (cgst + sgst + igst) as total_gst,
        net_total
      FROM bills
      WHERE firm_id = ? AND bill_type = 'PURCHASE' AND status != 'CANCELLED'
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

    query += ` ORDER BY bill_date, bill_no`;

    const report = db.prepare(query).all(...params);

    res.json(report);

  } catch (error) {
    console.error('Error fetching GST purchase report:', error);
    res.status(500).json({ error: 'Failed to fetch GST purchase report' });
  }
}

/**
 * Get GSTR-1 report
 */
export async function getGSTR1Report(req, res) {
  try {
    const { firm_id } = req.user;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    const fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const toDate = new Date(year, month, 0).toISOString().split('T')[0];

    // B2B Invoices
    const b2b = db.prepare(`
      SELECT 
        party_gstin,
        party_name,
        bill_no,
        bill_date,
        gross_total as taxable_value,
        cgst,
        sgst,
        igst,
        net_total
      FROM bills
      WHERE firm_id = ? AND bill_type = 'SALES' 
        AND status != 'CANCELLED'
        AND party_gstin IS NOT NULL AND party_gstin != ''
        AND bill_date BETWEEN ? AND ?
      ORDER BY bill_date
    `).all(firm_id, fromDate, toDate);

    // B2C Large (> 2.5 lakhs)
    const b2cl = db.prepare(`
      SELECT 
        bill_no,
        bill_date,
        gross_total as taxable_value,
        cgst,
        sgst,
        igst,
        net_total
      FROM bills
      WHERE firm_id = ? AND bill_type = 'SALES' 
        AND status != 'CANCELLED'
        AND (party_gstin IS NULL OR party_gstin = '')
        AND net_total > 250000
        AND bill_date BETWEEN ? AND ?
      ORDER BY bill_date
    `).all(firm_id, fromDate, toDate);

    // B2C Small (< 2.5 lakhs)
    const b2cs = db.prepare(`
      SELECT 
        SUM(gross_total) as taxable_value,
        SUM(cgst) as cgst,
        SUM(sgst) as sgst,
        SUM(igst) as igst,
        COUNT(*) as invoice_count
      FROM bills
      WHERE firm_id = ? AND bill_type = 'SALES' 
        AND status != 'CANCELLED'
        AND (party_gstin IS NULL OR party_gstin = '')
        AND net_total <= 250000
        AND bill_date BETWEEN ? AND ?
    `).get(firm_id, fromDate, toDate);

    res.json({
      period: { month, year, fromDate, toDate },
      b2b,
      b2cl,
      b2cs
    });

  } catch (error) {
    console.error('Error fetching GSTR-1 report:', error);
    res.status(500).json({ error: 'Failed to fetch GSTR-1 report' });
  }
}

/**
 * Get GSTR-3B report
 */
export async function getGSTR3BReport(req, res) {
  try {
    const { firm_id } = req.user;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    const fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const toDate = new Date(year, month, 0).toISOString().split('T')[0];

    // Outward supplies (Sales)
    const outward = db.prepare(`
      SELECT 
        SUM(gross_total) as taxable_value,
        SUM(cgst) as cgst,
        SUM(sgst) as sgst,
        SUM(igst) as igst,
        SUM(cgst + sgst + igst) as total_tax
      FROM bills
      WHERE firm_id = ? AND bill_type = 'SALES' 
        AND status != 'CANCELLED'
        AND bill_date BETWEEN ? AND ?
    `).get(firm_id, fromDate, toDate);

    // Inward supplies (Purchase)
    const inward = db.prepare(`
      SELECT 
        SUM(gross_total) as taxable_value,
        SUM(cgst) as cgst,
        SUM(sgst) as sgst,
        SUM(igst) as igst,
        SUM(cgst + sgst + igst) as total_tax
      FROM bills
      WHERE firm_id = ? AND bill_type = 'PURCHASE' 
        AND status != 'CANCELLED'
        AND bill_date BETWEEN ? AND ?
    `).get(firm_id, fromDate, toDate);

    // Net tax liability
    const net_cgst = (outward.cgst || 0) - (inward.cgst || 0);
    const net_sgst = (outward.sgst || 0) - (inward.sgst || 0);
    const net_igst = (outward.igst || 0) - (inward.igst || 0);
    const net_tax = net_cgst + net_sgst + net_igst;

    res.json({
      period: { month, year, fromDate, toDate },
      outward_supplies: outward,
      inward_supplies: inward,
      net_tax_liability: {
        cgst: net_cgst,
        sgst: net_sgst,
        igst: net_igst,
        total: net_tax
      }
    });

  } catch (error) {
    console.error('Error fetching GSTR-3B report:', error);
    res.status(500).json({ error: 'Failed to fetch GSTR-3B report' });
  }
}

/**
 * Get profit & loss report
 */
export async function getProfitLoss(req, res) {
  try {
    const { firm_id } = req.user;
    const { fromDate, toDate } = req.query;

    let query = `
      SELECT 
        account_type,
        SUM(debit) as total_debit,
        SUM(credit) as total_credit
      FROM ledger
      WHERE firm_id = ?
        AND account_type IN ('SALES', 'PURCHASE', 'EXPENSES', 'INCOME')
    `;
    const params = [firm_id];

    if (fromDate) {
      query += ` AND entry_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND entry_date <= ?`;
      params.push(toDate);
    }

    query += ` GROUP BY account_type`;

    const results = db.prepare(query).all(...params);

    let sales = 0, purchase = 0, expenses = 0, income = 0;

    results.forEach(r => {
      if (r.account_type === 'SALES') sales = r.total_credit - r.total_debit;
      if (r.account_type === 'PURCHASE') purchase = r.total_debit - r.total_credit;
      if (r.account_type === 'EXPENSES') expenses = r.total_debit - r.total_credit;
      if (r.account_type === 'INCOME') income = r.total_credit - r.total_debit;
    });

    const gross_profit = sales - purchase;
    const net_profit = gross_profit + income - expenses;

    res.json({
      sales,
      purchase,
      gross_profit,
      income,
      expenses,
      net_profit
    });

  } catch (error) {
    console.error('Error fetching P&L:', error);
    res.status(500).json({ error: 'Failed to fetch P&L report' });
  }
}

/**
 * Get balance sheet report
 */
export async function getBalanceSheet(req, res) {
  try {
    const { firm_id } = req.user;
    const { toDate } = req.query;

    let query = `
      SELECT 
        account_type,
        SUM(debit) as total_debit,
        SUM(credit) as total_credit
      FROM ledger
      WHERE firm_id = ?
    `;
    const params = [firm_id];

    if (toDate) {
      query += ` AND entry_date <= ?`;
      params.push(toDate);
    }

    query += ` GROUP BY account_type`;

    const results = db.prepare(query).all(...params);

    let assets = 0, liabilities = 0, capital = 0;
    let debtors = 0, creditors = 0;

    results.forEach(r => {
      const balance = r.total_debit - r.total_credit;
      
      if (r.account_type === 'ASSETS') assets += balance;
      if (r.account_type === 'LIABILITIES') liabilities += Math.abs(balance);
      if (r.account_type === 'CAPITAL') capital += Math.abs(balance);
      if (r.account_type === 'SUNDRY_DEBTORS') debtors += balance;
      if (r.account_type === 'SUNDRY_CREDITORS') creditors += Math.abs(balance);
    });

    const total_assets = assets + debtors;
    const total_liabilities = liabilities + creditors + capital;

    res.json({
      assets: {
        fixed_assets: assets,
        sundry_debtors: debtors,
        total: total_assets
      },
      liabilities: {
        capital,
        liabilities,
        sundry_creditors: creditors,
        total: total_liabilities
      },
      difference: total_assets - total_liabilities
    });

  } catch (error) {
    console.error('Error fetching balance sheet:', error);
    res.status(500).json({ error: 'Failed to fetch balance sheet' });
  }
}

/**
 * Get cash flow report
 */
export async function getCashFlow(req, res) {
  try {
    const { firm_id } = req.user;
    const { fromDate, toDate } = req.query;

    let query = `
      SELECT 
        account_type,
        SUM(debit) as total_debit,
        SUM(credit) as total_credit
      FROM ledger
      WHERE firm_id = ?
        AND account_type IN ('CASH', 'BANK')
    `;
    const params = [firm_id];

    if (fromDate) {
      query += ` AND entry_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND entry_date <= ?`;
      params.push(toDate);
    }

    query += ` GROUP BY account_type`;

    const results = db.prepare(query).all(...params);

    let cash_inflow = 0, cash_outflow = 0;

    results.forEach(r => {
      cash_inflow += r.total_debit;
      cash_outflow += r.total_credit;
    });

    const net_cash_flow = cash_inflow - cash_outflow;

    res.json({
      cash_inflow,
      cash_outflow,
      net_cash_flow
    });

  } catch (error) {
    console.error('Error fetching cash flow:', error);
    res.status(500).json({ error: 'Failed to fetch cash flow' });
  }
}

/**
 * Get trial balance report
 */
export async function getTrialBalance(req, res) {
  try {
    const { firm_id } = req.user;
    const { fromDate, toDate } = req.query;

    let query = `
      SELECT 
        account_name,
        account_type,
        SUM(debit) as total_debit,
        SUM(credit) as total_credit,
        (SUM(debit) - SUM(credit)) as balance
      FROM ledger
      WHERE firm_id = ?
    `;
    const params = [firm_id];

    if (fromDate) {
      query += ` AND entry_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND entry_date <= ?`;
      params.push(toDate);
    }

    query += ` GROUP BY account_name, account_type ORDER BY account_type, account_name`;

    const accounts = db.prepare(query).all(...params);

    const trial_balance = accounts.map(acc => ({
      account_name: acc.account_name,
      account_type: acc.account_type,
      debit: acc.balance >= 0 ? Math.abs(acc.balance) : 0,
      credit: acc.balance < 0 ? Math.abs(acc.balance) : 0
    }));

    const total_debit = trial_balance.reduce((sum, acc) => sum + acc.debit, 0);
    const total_credit = trial_balance.reduce((sum, acc) => sum + acc.credit, 0);

    res.json({
      accounts: trial_balance,
      total_debit,
      total_credit,
      difference: Math.abs(total_debit - total_credit)
    });

  } catch (error) {
    console.error('Error fetching trial balance:', error);
    res.status(500).json({ error: 'Failed to fetch trial balance' });
  }
}

/**
 * Get dashboard overview
 */
export async function getDashboardOverview(req, res) {
  try {
    const { firm_id } = req.user;

    // Sales summary
    const sales = db.prepare(`
      SELECT 
        COUNT(*) as count,
        SUM(net_total) as total,
        SUM(net_total - paid_amount) as outstanding
      FROM bills
      WHERE firm_id = ? AND bill_type = 'SALES' AND status != 'CANCELLED'
    `).get(firm_id);

    // Purchase summary
    const purchase = db.prepare(`
      SELECT 
        COUNT(*) as count,
        SUM(net_total) as total,
        SUM(net_total - paid_amount) as outstanding
      FROM bills
      WHERE firm_id = ? AND bill_type = 'PURCHASE' AND status != 'CANCELLED'
    `).get(firm_id);

    // Stock summary
    const stock = db.prepare(`
      SELECT 
        COUNT(*) as total_items,
        SUM(current_stock * rate) as total_value,
        COUNT(CASE WHEN current_stock <= reorder_level THEN 1 END) as low_stock_items
      FROM stocks
      WHERE firm_id = ?
    `).get(firm_id);

    // Party summary
    const parties = db.prepare(`
      SELECT 
        COUNT(CASE WHEN party_type = 'CUSTOMER' THEN 1 END) as customers,
        COUNT(CASE WHEN party_type = 'SUPPLIER' THEN 1 END) as suppliers
      FROM parties
      WHERE firm_id = ?
    `).get(firm_id);

    res.json({
      sales,
      purchase,
      stock,
      parties
    });

  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
}

/**
 * Get dashboard charts data
 */
export async function getDashboardCharts(req, res) {
  try {
    const { firm_id } = req.user;

    // Monthly sales/purchase trend (last 12 months)
    const trend = db.prepare(`
      SELECT 
        strftime('%Y-%m', bill_date) as month,
        bill_type,
        SUM(net_total) as total
      FROM bills
      WHERE firm_id = ? 
        AND status != 'CANCELLED'
        AND bill_date >= date('now', '-12 months')
      GROUP BY month, bill_type
      ORDER BY month
    `).all(firm_id);

    // Top 5 customers by sales
    const top_customers = db.prepare(`
      SELECT 
        party_name,
        SUM(net_total) as total
      FROM bills
      WHERE firm_id = ? AND bill_type = 'SALES' AND status != 'CANCELLED'
      GROUP BY party_name
      ORDER BY total DESC
      LIMIT 5
    `).all(firm_id);

    // Top 5 items by sales
    const top_items = db.prepare(`
      SELECT 
        bi.item_name,
        SUM(bi.amount) as total
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE b.firm_id = ? AND b.bill_type = 'SALES' AND b.status != 'CANCELLED'
      GROUP BY bi.item_name
      ORDER BY total DESC
      LIMIT 5
    `).all(firm_id);

    res.json({
      trend,
      top_customers,
      top_items
    });

  } catch (error) {
    console.error('Error fetching dashboard charts:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard charts' });
  }
}
