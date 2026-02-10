/**
 * Ledger Controller
 * Handles chart of accounts, ledger entries, and financial reports
 */

import { db } from '../utils/db.js';
import { 
  getAccountBalance as calculateAccountBalance, 
  getTrialBalance as calculateTrialBalance 
} from '../utils/ledgerHelper.js';

/**
 * Get all accounts (chart of accounts)
 */
export async function getAllAccounts(req, res) {
  try {
    const { firm_id, role } = req.user;
    
    if (!firm_id && role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. No firm assigned.' });
    }

    const { account_type, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT DISTINCT 
        account_name,
        account_type,
        COUNT(*) as entry_count,
        SUM(debit) as total_debit,
        SUM(credit) as total_credit,
        (SUM(debit) - SUM(credit)) as balance
      FROM ledger
      WHERE firm_id = ?
    `;
    const params = [firm_id];

    if (account_type) {
      query += ` AND account_type = ?`;
      params.push(account_type);
    }

    query += ` GROUP BY account_name, account_type`;
    query += ` ORDER BY account_type, account_name`;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const accounts = db.prepare(query).all(...params);

    // Add balance type
    const accountsWithBalance = accounts.map(acc => ({
      ...acc,
      balance_amount: Math.abs(acc.balance),
      balance_type: acc.balance >= 0 ? 'Dr' : 'Cr'
    }));

    res.json(accountsWithBalance);

  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
}

/**
 * Get account by name
 */
export async function getAccountByName(req, res) {
  try {
    const { firm_id } = req.user;
    const { name } = req.params;

    const account = db.prepare(`
      SELECT 
        account_name,
        account_type,
        COUNT(*) as entry_count,
        SUM(debit) as total_debit,
        SUM(credit) as total_credit,
        (SUM(debit) - SUM(credit)) as balance
      FROM ledger
      WHERE firm_id = ? AND account_name = ?
      GROUP BY account_name, account_type
    `).get(firm_id, name);

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    account.balance_amount = Math.abs(account.balance);
    account.balance_type = account.balance >= 0 ? 'Dr' : 'Cr';

    res.json(account);

  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
}

/**
 * Create account (first entry creates account)
 */
export async function createAccount(req, res) {
  try {
    const { firm_id, id: user_id } = req.user;
    const { account_name, account_type, opening_balance = 0, balance_type = 'Dr' } = req.body;

    if (!account_name || !account_type) {
      return res.status(400).json({ error: 'Account name and type are required' });
    }

    // Check if account exists
    const existing = db.prepare(`
      SELECT COUNT(*) as count FROM ledger 
      WHERE firm_id = ? AND account_name = ?
    `).get(firm_id, account_name);

    if (existing.count > 0) {
      return res.status(400).json({ error: 'Account already exists' });
    }

    // Create opening entry if balance > 0
    if (opening_balance > 0) {
      const debit = balance_type === 'Dr' ? opening_balance : 0;
      const credit = balance_type === 'Cr' ? opening_balance : 0;

      db.prepare(`
        INSERT INTO ledger (
          firm_id, entry_date, account_name, account_type,
          debit, credit, narration, ref_type
        ) VALUES (?, date('now'), ?, ?, ?, ?, 'Opening Balance', 'OPENING')
      `).run(firm_id, account_name, account_type, debit, credit);
    }

    res.status(201).json({ message: 'Account created successfully' });

  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
}

/**
 * Update account (rename)
 */
export async function updateAccount(req, res) {
  try {
    const { firm_id } = req.user;
    const { name } = req.params;
    const { new_name } = req.body;

    if (!new_name) {
      return res.status(400).json({ error: 'New account name is required' });
    }

    // Check if new name already exists
    const existing = db.prepare(`
      SELECT COUNT(*) as count FROM ledger 
      WHERE firm_id = ? AND account_name = ?
    `).get(firm_id, new_name);

    if (existing.count > 0) {
      return res.status(400).json({ error: 'Account name already exists' });
    }

    // Update all entries
    db.prepare(`
      UPDATE ledger SET account_name = ?
      WHERE firm_id = ? AND account_name = ?
    `).run(new_name, firm_id, name);

    res.json({ message: 'Account updated successfully' });

  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
}

/**
 * Delete account
 */
export async function deleteAccount(req, res) {
  try {
    const { firm_id } = req.user;
    const { name } = req.params;

    // Check if account has entries
    const entryCount = db.prepare(`
      SELECT COUNT(*) as count FROM ledger 
      WHERE firm_id = ? AND account_name = ?
    `).get(firm_id, name);

    if (entryCount.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete account with entries. Archive it instead.' 
      });
    }

    res.json({ message: 'No entries to delete' });

  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
}

/**
 * Get all ledger entries
 */
export async function getAllEntries(req, res) {
  try {
    const { firm_id } = req.user;
    const { 
      account_name, 
      account_type,
      ref_type,
      fromDate, 
      toDate,
      page = 1, 
      limit = 100 
    } = req.query;

    const offset = (page - 1) * limit;

    let query = `SELECT * FROM ledger WHERE firm_id = ?`;
    const params = [firm_id];

    if (account_name) {
      query += ` AND account_name = ?`;
      params.push(account_name);
    }

    if (account_type) {
      query += ` AND account_type = ?`;
      params.push(account_type);
    }

    if (ref_type) {
      query += ` AND ref_type = ?`;
      params.push(ref_type);
    }

    if (fromDate) {
      query += ` AND entry_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND entry_date <= ?`;
      params.push(toDate);
    }

    query += ` ORDER BY entry_date DESC, id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const entries = db.prepare(query).all(...params);

    res.json(entries);

  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
}

/**
 * Get entry by ID
 */
export async function getEntryById(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;

    const entry = db.prepare(`
      SELECT * FROM ledger WHERE id = ? AND firm_id = ?
    `).get(id, firm_id);

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json(entry);

  } catch (error) {
    console.error('Error fetching entry:', error);
    res.status(500).json({ error: 'Failed to fetch entry' });
  }
}

/**
 * Create manual ledger entry
 */
export async function createManualEntry(req, res) {
  try {
    const { firm_id, id: user_id } = req.user;
    const { entries } = req.body;

    if (!entries || entries.length === 0) {
      return res.status(400).json({ error: 'Entries are required' });
    }

    // Validate double entry (total debit = total credit)
    const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ 
        error: 'Total debit must equal total credit',
        totalDebit,
        totalCredit
      });
    }

    // Insert entries
    db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO ledger (
          firm_id, entry_date, account_name, account_type,
          debit, credit, narration, ref_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'MANUAL')
      `);

      entries.forEach(entry => {
        stmt.run(
          firm_id,
          entry.entry_date || new Date().toISOString().split('T')[0],
          entry.account_name,
          entry.account_type,
          entry.debit || 0,
          entry.credit || 0,
          entry.narration || 'Manual entry'
        );
      });
    })();

    res.status(201).json({ message: 'Manual entries created successfully' });

  } catch (error) {
    console.error('Error creating manual entry:', error);
    res.status(500).json({ error: 'Failed to create manual entry' });
  }
}

/**
 * Delete ledger entry
 */
export async function deleteEntry(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;

    const entry = db.prepare(`
      SELECT * FROM ledger WHERE id = ? AND firm_id = ?
    `).get(id, firm_id);

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    if (entry.ref_type !== 'MANUAL' && entry.ref_type !== 'OPENING') {
      return res.status(400).json({ 
        error: 'Cannot delete system-generated entries. Delete the source document instead.' 
      });
    }

    db.prepare(`DELETE FROM ledger WHERE id = ? AND firm_id = ?`).run(id, firm_id);

    res.json({ message: 'Entry deleted successfully' });

  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
}

/**
 * Get account ledger
 */
export async function getAccountLedger(req, res) {
  try {
    const { firm_id } = req.user;
    const { name } = req.params;
    const { fromDate, toDate } = req.query;

    let query = `
      SELECT * FROM ledger
      WHERE firm_id = ? AND account_name = ?
    `;
    const params = [firm_id, name];

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
    const entriesWithBalance = entries.map(entry => {
      balance += entry.debit - entry.credit;
      return {
        ...entry,
        balance: Math.abs(balance),
        balance_type: balance >= 0 ? 'Dr' : 'Cr'
      };
    });

    res.json({
      account_name: name,
      entries: entriesWithBalance,
      opening_balance: 0,
      closing_balance: Math.abs(balance),
      closing_balance_type: balance >= 0 ? 'Dr' : 'Cr'
    });

  } catch (error) {
    console.error('Error fetching account ledger:', error);
    res.status(500).json({ error: 'Failed to fetch account ledger' });
  }
}

/**
 * Get account balance
 */
export async function getAccountBalance(req, res) {
  try {
    const { firm_id } = req.user;
    const { name } = req.params;
    const { toDate } = req.query;

    const balance = calculateAccountBalance(firm_id, name, toDate);

    res.json({
      account_name: name,
      ...balance
    });

  } catch (error) {
    console.error('Error fetching account balance:', error);
    res.status(500).json({ error: 'Failed to fetch account balance' });
  }
}

/**
 * Get trial balance
 */
export async function getTrialBalance(req, res) {
  try {
    const { firm_id } = req.user;
    const { fromDate, toDate } = req.query;

    const trialBalance = calculateTrialBalance(
      firm_id,
      fromDate || '1900-01-01',
      toDate || '2099-12-31'
    );

    // Calculate totals
    const totalDebit = trialBalance.reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredit = trialBalance.reduce((sum, acc) => sum + acc.credit, 0);

    res.json({
      accounts: trialBalance,
      total_debit: totalDebit,
      total_credit: totalCredit,
      difference: Math.abs(totalDebit - totalCredit)
    });

  } catch (error) {
    console.error('Error fetching trial balance:', error);
    res.status(500).json({ error: 'Failed to fetch trial balance' });
  }
}

/**
 * Get profit & loss statement
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

    // Calculate P&L
    let sales = 0, purchase = 0, expenses = 0, income = 0;

    results.forEach(r => {
      if (r.account_type === 'SALES') sales = r.total_credit - r.total_debit;
      if (r.account_type === 'PURCHASE') purchase = r.total_debit - r.total_credit;
      if (r.account_type === 'EXPENSES') expenses = r.total_debit - r.total_credit;
      if (r.account_type === 'INCOME') income = r.total_credit - r.total_debit;
    });

    const grossProfit = sales - purchase;
    const netProfit = grossProfit + income - expenses;

    res.json({
      sales,
      purchase,
      gross_profit: grossProfit,
      income,
      expenses,
      net_profit: netProfit
    });

  } catch (error) {
    console.error('Error fetching P&L:', error);
    res.status(500).json({ error: 'Failed to fetch P&L statement' });
  }
}

/**
 * Get balance sheet
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

    // Calculate balance sheet items
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

    const totalAssets = assets + debtors;
    const totalLiabilities = liabilities + creditors + capital;

    res.json({
      assets: {
        fixed_assets: assets,
        sundry_debtors: debtors,
        total: totalAssets
      },
      liabilities: {
        capital,
        liabilities,
        sundry_creditors: creditors,
        total: totalLiabilities
      },
      difference: totalAssets - totalLiabilities
    });

  } catch (error) {
    console.error('Error fetching balance sheet:', error);
    res.status(500).json({ error: 'Failed to fetch balance sheet' });
  }
}

/**
 * Get cash flow statement
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

    let cashInflow = 0, cashOutflow = 0;

    results.forEach(r => {
      cashInflow += r.total_debit;
      cashOutflow += r.total_credit;
    });

    const netCashFlow = cashInflow - cashOutflow;

    res.json({
      cash_inflow: cashInflow,
      cash_outflow: cashOutflow,
      net_cash_flow: netCashFlow
    });

  } catch (error) {
    console.error('Error fetching cash flow:', error);
    res.status(500).json({ error: 'Failed to fetch cash flow statement' });
  }
}

/**
 * Get accounts by group
 */
export async function getAccountsByGroup(req, res) {
  try {
    const { firm_id } = req.user;

    const accounts = db.prepare(`
      SELECT 
        account_type,
        COUNT(DISTINCT account_name) as account_count,
        SUM(debit) as total_debit,
        SUM(credit) as total_credit,
        (SUM(debit) - SUM(credit)) as balance
      FROM ledger
      WHERE firm_id = ?
      GROUP BY account_type
      ORDER BY account_type
    `).all(firm_id);

    const accountsWithBalance = accounts.map(acc => ({
      ...acc,
      balance_amount: Math.abs(acc.balance),
      balance_type: acc.balance >= 0 ? 'Dr' : 'Cr'
    }));

    res.json(accountsWithBalance);

  } catch (error) {
    console.error('Error fetching accounts by group:', error);
    res.status(500).json({ error: 'Failed to fetch accounts by group' });
  }
}
