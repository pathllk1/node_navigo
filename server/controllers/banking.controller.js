/**
 * Banking Controller
 * Handles bank accounts, transactions, and reconciliation
 */

import { db } from '../utils/db.js';
import { postVoucherToLedger, reverseLedgerEntries } from '../utils/ledgerHelper.js';

/**
 * Get all bank accounts
 */
export async function getAllBankAccounts(req, res) {
  try {
    const { firm_id, role } = req.user;
    
    if (!firm_id && role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. No firm assigned.' });
    }

    const accounts = db.prepare(`
      SELECT 
        ba.*,
        (SELECT SUM(amount) FROM bank_transactions WHERE bank_account_id = ba.id AND transaction_type = 'DEPOSIT') as total_credits,
        (SELECT SUM(amount) FROM bank_transactions WHERE bank_account_id = ba.id AND transaction_type = 'WITHDRAWAL') as total_debits,
        (ba.opening_balance + 
         COALESCE((SELECT SUM(amount) FROM bank_transactions WHERE bank_account_id = ba.id AND transaction_type = 'DEPOSIT'), 0) -
         COALESCE((SELECT SUM(amount) FROM bank_transactions WHERE bank_account_id = ba.id AND transaction_type = 'WITHDRAWAL'), 0)
        ) as current_balance
      FROM bank_accounts ba
      WHERE ba.firm_id = ?
      ORDER BY ba.account_name
    `).all(firm_id);

    res.json(accounts);

  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    res.status(500).json({ error: 'Failed to fetch bank accounts' });
  }
}

/**
 * Get bank account by ID
 */
export async function getBankAccountById(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;

    const account = db.prepare(`
      SELECT * FROM bank_accounts WHERE id = ? AND firm_id = ?
    `).get(id, firm_id);

    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    res.json(account);

  } catch (error) {
    console.error('Error fetching bank account:', error);
    res.status(500).json({ error: 'Failed to fetch bank account' });
  }
}

/**
 * Create bank account
 */
export async function createBankAccount(req, res) {
  try {
    const { firm_id, id: user_id } = req.user;
    const {
      account_name,
      account_number,
      bank_name,
      branch,
      ifsc_code,
      account_type = 'SAVINGS',
      opening_balance = 0,
      opening_date
    } = req.body;

    if (!account_name || !bank_name) {
      return res.status(400).json({ error: 'Account name and bank name are required' });
    }

    const result = db.prepare(`
      INSERT INTO bank_accounts (
        firm_id, account_name, account_number, bank_name, branch,
        ifsc_code, account_type, opening_balance, opening_date, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      firm_id, account_name, account_number, bank_name, branch,
      ifsc_code, account_type, opening_balance,
      opening_date || new Date().toISOString().split('T')[0],
      user_id
    );

    res.status(201).json({
      message: 'Bank account created successfully',
      accountId: result.lastInsertRowid
    });

  } catch (error) {
    console.error('Error creating bank account:', error);
    res.status(500).json({ error: 'Failed to create bank account' });
  }
}

/**
 * Update bank account
 */
export async function updateBankAccount(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;
    const {
      account_name,
      account_number,
      bank_name,
      branch,
      ifsc_code,
      account_type,
      is_active
    } = req.body;

    const existing = db.prepare(`
      SELECT * FROM bank_accounts WHERE id = ? AND firm_id = ?
    `).get(id, firm_id);

    if (!existing) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    db.prepare(`
      UPDATE bank_accounts SET
        account_name = COALESCE(?, account_name),
        account_number = COALESCE(?, account_number),
        bank_name = COALESCE(?, bank_name),
        branch = COALESCE(?, branch),
        ifsc_code = COALESCE(?, ifsc_code),
        account_type = COALESCE(?, account_type),
        is_active = COALESCE(?, is_active),
        updated_at = datetime('now')
      WHERE id = ? AND firm_id = ?
    `).run(
      account_name, account_number, bank_name, branch, ifsc_code,
      account_type, is_active, id, firm_id
    );

    res.json({ message: 'Bank account updated successfully' });

  } catch (error) {
    console.error('Error updating bank account:', error);
    res.status(500).json({ error: 'Failed to update bank account' });
  }
}

/**
 * Delete bank account
 */
export async function deleteBankAccount(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;

    const account = db.prepare(`
      SELECT * FROM bank_accounts WHERE id = ? AND firm_id = ?
    `).get(id, firm_id);

    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    // Check if account has transactions
    const txnCount = db.prepare(`
      SELECT COUNT(*) as count FROM bank_transactions WHERE bank_account_id = ?
    `).get(id);

    if (txnCount.count > 0) {
      return res.status(400).json({
        error: 'Cannot delete bank account with transactions. Deactivate it instead.'
      });
    }

    db.prepare(`DELETE FROM bank_accounts WHERE id = ? AND firm_id = ?`).run(id, firm_id);

    res.json({ message: 'Bank account deleted successfully' });

  } catch (error) {
    console.error('Error deleting bank account:', error);
    res.status(500).json({ error: 'Failed to delete bank account' });
  }
}

/**
 * Get account balance
 */
export async function getAccountBalance(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;
    const { toDate } = req.query;

    const account = db.prepare(`
      SELECT * FROM bank_accounts WHERE id = ? AND firm_id = ?
    `).get(id, firm_id);

    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    let query = `
      SELECT 
        SUM(CASE WHEN transaction_type = 'DEPOSIT' THEN amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN transaction_type = 'WITHDRAWAL' THEN amount ELSE 0 END) as total_debits
      FROM bank_transactions
      WHERE bank_account_id = ?
    `;
    const params = [id];

    if (toDate) {
      query += ` AND transaction_date <= ?`;
      params.push(toDate);
    }

    const result = db.prepare(query).get(...params);

    const balance = account.opening_balance + 
                   (result.total_credits || 0) - 
                   (result.total_debits || 0);

    res.json({
      account_name: account.account_name,
      opening_balance: account.opening_balance,
      total_credits: result.total_credits || 0,
      total_debits: result.total_debits || 0,
      current_balance: balance
    });

  } catch (error) {
    console.error('Error fetching account balance:', error);
    res.status(500).json({ error: 'Failed to fetch account balance' });
  }
}

/**
 * Get all transactions
 */
export async function getAllTransactions(req, res) {
  try {
    const { firm_id } = req.user;
    const { 
      bank_account_id, 
      type, 
      fromDate, 
      toDate,
      reconciled,
      page = 1, 
      limit = 50 
    } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT bt.*, ba.account_name, ba.bank_name
      FROM bank_transactions bt
      JOIN bank_accounts ba ON bt.bank_account_id = ba.id
      WHERE ba.firm_id = ?
    `;
    const params = [firm_id];

    if (bank_account_id) {
      query += ` AND bt.bank_account_id = ?`;
      params.push(bank_account_id);
    }

    if (type) {
      query += ` AND bt.transaction_type = ?`;
      params.push(type);
    }

    if (fromDate) {
      query += ` AND bt.transaction_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND bt.transaction_date <= ?`;
      params.push(toDate);
    }

    if (reconciled !== undefined) {
      query += ` AND bt.is_reconciled = ?`;
      params.push(reconciled === 'true' ? 1 : 0);
    }

    query += ` ORDER BY bt.transaction_date DESC, bt.id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const transactions = db.prepare(query).all(...params);

    res.json(transactions);

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
}

/**
 * Get transaction by ID
 */
export async function getTransactionById(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;

    const transaction = db.prepare(`
      SELECT bt.*, ba.account_name, ba.bank_name
      FROM bank_transactions bt
      JOIN bank_accounts ba ON bt.bank_account_id = ba.id
      WHERE bt.id = ? AND ba.firm_id = ?
    `).get(id, firm_id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);

  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
}

/**
 * Create transaction
 */
export async function createTransaction(req, res) {
  try {
    const { firm_id, id: user_id } = req.user;
    const {
      bank_account_id,
      transaction_date,
      type,
      amount,
      description,
      reference_no,
      cheque_no,
      cheque_date,
      party_name
    } = req.body;

    if (!bank_account_id || !transaction_date || !type || !amount) {
      return res.status(400).json({
        error: 'Bank account, date, type, and amount are required'
      });
    }

    if (!['CREDIT', 'DEBIT'].includes(type)) {
      return res.status(400).json({ error: 'Type must be CREDIT or DEBIT' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Verify bank account belongs to firm
    const account = db.prepare(`
      SELECT * FROM bank_accounts WHERE id = ? AND firm_id = ?
    `).get(bank_account_id, firm_id);

    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    const result = db.prepare(`
      INSERT INTO bank_transactions (
        bank_account_id, transaction_date, type, amount, description,
        reference_no, cheque_no, cheque_date, party_name, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bank_account_id, transaction_date, type, amount, description,
      reference_no, cheque_no, cheque_date, party_name, user_id
    );

    res.status(201).json({
      message: 'Transaction created successfully',
      transactionId: result.lastInsertRowid
    });

  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
}

/**
 * Update transaction
 */
export async function updateTransaction(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;
    const {
      transaction_date,
      type,
      amount,
      description,
      reference_no,
      cheque_no,
      cheque_date,
      party_name
    } = req.body;

    // Verify transaction belongs to firm
    const existing = db.prepare(`
      SELECT bt.* FROM bank_transactions bt
      JOIN bank_accounts ba ON bt.bank_account_id = ba.id
      WHERE bt.id = ? AND ba.firm_id = ?
    `).get(id, firm_id);

    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (existing.is_reconciled) {
      return res.status(400).json({
        error: 'Cannot update reconciled transaction'
      });
    }

    if (amount && amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    db.prepare(`
      UPDATE bank_transactions SET
        transaction_date = COALESCE(?, transaction_date),
        type = COALESCE(?, type),
        amount = COALESCE(?, amount),
        description = COALESCE(?, description),
        reference_no = COALESCE(?, reference_no),
        cheque_no = COALESCE(?, cheque_no),
        cheque_date = COALESCE(?, cheque_date),
        party_name = COALESCE(?, party_name),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      transaction_date, type, amount, description, reference_no,
      cheque_no, cheque_date, party_name, id
    );

    res.json({ message: 'Transaction updated successfully' });

  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
}

/**
 * Delete transaction
 */
export async function deleteTransaction(req, res) {
  try {
    const { firm_id } = req.user;
    const { id } = req.params;

    const transaction = db.prepare(`
      SELECT bt.* FROM bank_transactions bt
      JOIN bank_accounts ba ON bt.bank_account_id = ba.id
      WHERE bt.id = ? AND ba.firm_id = ?
    `).get(id, firm_id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.is_reconciled) {
      return res.status(400).json({
        error: 'Cannot delete reconciled transaction'
      });
    }

    db.prepare(`DELETE FROM bank_transactions WHERE id = ?`).run(id);

    res.json({ message: 'Transaction deleted successfully' });

  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
}

/**
 * Get reconciliation data
 */
export async function getReconciliationData(req, res) {
  try {
    const { firm_id } = req.user;
    const { accountId } = req.params;
    const { fromDate, toDate } = req.query;

    const account = db.prepare(`
      SELECT * FROM bank_accounts WHERE id = ? AND firm_id = ?
    `).get(accountId, firm_id);

    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    let query = `
      SELECT * FROM bank_transactions
      WHERE bank_account_id = ?
    `;
    const params = [accountId];

    if (fromDate) {
      query += ` AND transaction_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND transaction_date <= ?`;
      params.push(toDate);
    }

    query += ` ORDER BY transaction_date, id`;

    const transactions = db.prepare(query).all(...params);

    const reconciled = transactions.filter(t => t.is_reconciled);
    const unreconciled = transactions.filter(t => !t.is_reconciled);

    res.json({
      account,
      reconciled,
      unreconciled,
      summary: {
        total_transactions: transactions.length,
        reconciled_count: reconciled.length,
        unreconciled_count: unreconciled.length,
        reconciled_amount: reconciled.reduce((sum, t) => 
          sum + (t.type === 'CREDIT' ? t.amount : -t.amount), 0),
        unreconciled_amount: unreconciled.reduce((sum, t) => 
          sum + (t.type === 'CREDIT' ? t.amount : -t.amount), 0)
      }
    });

  } catch (error) {
    console.error('Error fetching reconciliation data:', error);
    res.status(500).json({ error: 'Failed to fetch reconciliation data' });
  }
}

/**
 * Match transaction (mark as reconciled)
 */
export async function matchTransaction(req, res) {
  try {
    const { firm_id } = req.user;
    const { accountId } = req.params;
    const { transaction_id, statement_date, statement_balance } = req.body;

    if (!transaction_id) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    // Verify transaction belongs to account and firm
    const transaction = db.prepare(`
      SELECT bt.* FROM bank_transactions bt
      JOIN bank_accounts ba ON bt.bank_account_id = ba.id
      WHERE bt.id = ? AND bt.bank_account_id = ? AND ba.firm_id = ?
    `).get(transaction_id, accountId, firm_id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    db.prepare(`
      UPDATE bank_transactions SET
        is_reconciled = 1,
        reconciled_date = ?,
        statement_balance = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(statement_date || new Date().toISOString().split('T')[0], statement_balance, transaction_id);

    res.json({ message: 'Transaction marked as reconciled' });

  } catch (error) {
    console.error('Error matching transaction:', error);
    res.status(500).json({ error: 'Failed to match transaction' });
  }
}

/**
 * Unmatch transaction (mark as unreconciled)
 */
export async function unmatchTransaction(req, res) {
  try {
    const { firm_id } = req.user;
    const { accountId } = req.params;
    const { transaction_id } = req.body;

    if (!transaction_id) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    // Verify transaction belongs to account and firm
    const transaction = db.prepare(`
      SELECT bt.* FROM bank_transactions bt
      JOIN bank_accounts ba ON bt.bank_account_id = ba.id
      WHERE bt.id = ? AND bt.bank_account_id = ? AND ba.firm_id = ?
    `).get(transaction_id, accountId, firm_id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    db.prepare(`
      UPDATE bank_transactions SET
        is_reconciled = 0,
        reconciled_date = NULL,
        statement_balance = NULL,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(transaction_id);

    res.json({ message: 'Transaction marked as unreconciled' });

  } catch (error) {
    console.error('Error unmatching transaction:', error);
    res.status(500).json({ error: 'Failed to unmatch transaction' });
  }
}

/**
 * Get reconciliation summary
 */
export async function getReconciliationSummary(req, res) {
  try {
    const { firm_id } = req.user;
    const { accountId } = req.params;
    const { toDate } = req.query;

    const account = db.prepare(`
      SELECT * FROM bank_accounts WHERE id = ? AND firm_id = ?
    `).get(accountId, firm_id);

    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    let query = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN is_reconciled = 1 THEN 1 ELSE 0 END) as reconciled_count,
        SUM(CASE WHEN is_reconciled = 0 THEN 1 ELSE 0 END) as unreconciled_count,
        SUM(CASE WHEN transaction_type = 'DEPOSIT' THEN amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN transaction_type = 'WITHDRAWAL' THEN amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN is_reconciled = 1 AND transaction_type = 'DEPOSIT' THEN amount ELSE 0 END) as reconciled_credits,
        SUM(CASE WHEN is_reconciled = 1 AND transaction_type = 'WITHDRAWAL' THEN amount ELSE 0 END) as reconciled_debits
      FROM bank_transactions
      WHERE bank_account_id = ?
    `;
    const params = [accountId];

    if (toDate) {
      query += ` AND transaction_date <= ?`;
      params.push(toDate);
    }

    const summary = db.prepare(query).get(...params);

    const book_balance = account.opening_balance + 
                        (summary.total_credits || 0) - 
                        (summary.total_debits || 0);

    const reconciled_balance = account.opening_balance + 
                              (summary.reconciled_credits || 0) - 
                              (summary.reconciled_debits || 0);

    const unreconciled_balance = book_balance - reconciled_balance;

    res.json({
      account_name: account.account_name,
      opening_balance: account.opening_balance,
      book_balance,
      reconciled_balance,
      unreconciled_balance,
      total_transactions: summary.total_transactions || 0,
      reconciled_count: summary.reconciled_count || 0,
      unreconciled_count: summary.unreconciled_count || 0
    });

  } catch (error) {
    console.error('Error fetching reconciliation summary:', error);
    res.status(500).json({ error: 'Failed to fetch reconciliation summary' });
  }
}

/**
 * Import bank statement
 */
export async function importBankStatement(req, res) {
  try {
    const { firm_id, id: user_id } = req.user;
    const { bank_account_id, transactions } = req.body;

    if (!bank_account_id || !transactions || transactions.length === 0) {
      return res.status(400).json({
        error: 'Bank account and transactions are required'
      });
    }

    const account = db.prepare(`
      SELECT * FROM bank_accounts WHERE id = ? AND firm_id = ?
    `).get(bank_account_id, firm_id);

    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    const imported = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO bank_transactions (
          bank_account_id, transaction_date, type, amount, description,
          reference_no, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      let count = 0;
      transactions.forEach(txn => {
        if (txn.transaction_date && txn.type && txn.amount) {
          stmt.run(
            bank_account_id,
            txn.transaction_date,
            txn.type,
            txn.amount,
            txn.description || '',
            txn.reference_no || '',
            user_id
          );
          count++;
        }
      });

      return count;
    })();

    res.status(201).json({
      message: 'Bank statement imported successfully',
      imported_count: imported
    });

  } catch (error) {
    console.error('Error importing bank statement:', error);
    res.status(500).json({ error: 'Failed to import bank statement' });
  }
}

/**
 * Get bank statements
 */
export async function getBankStatements(req, res) {
  try {
    const { firm_id } = req.user;
    const { accountId } = req.params;
    const { fromDate, toDate } = req.query;

    const account = db.prepare(`
      SELECT * FROM bank_accounts WHERE id = ? AND firm_id = ?
    `).get(accountId, firm_id);

    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    let query = `
      SELECT * FROM bank_transactions
      WHERE bank_account_id = ?
    `;
    const params = [accountId];

    if (fromDate) {
      query += ` AND transaction_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND transaction_date <= ?`;
      params.push(toDate);
    }

    query += ` ORDER BY transaction_date, id`;

    const transactions = db.prepare(query).all(...params);

    // Calculate running balance
    let balance = account.opening_balance;
    const statementsWithBalance = transactions.map(txn => {
      balance += txn.type === 'CREDIT' ? txn.amount : -txn.amount;
      return {
        ...txn,
        balance
      };
    });

    res.json({
      account,
      opening_balance: account.opening_balance,
      transactions: statementsWithBalance,
      closing_balance: balance
    });

  } catch (error) {
    console.error('Error fetching bank statements:', error);
    res.status(500).json({ error: 'Failed to fetch bank statements' });
  }
}

/**
 * Get cashbook
 */
export async function getCashbook(req, res) {
  try {
    const { firm_id } = req.user;
    const { fromDate, toDate } = req.query;

    // Get cash account
    const cashAccount = db.prepare(`
      SELECT * FROM bank_accounts 
      WHERE firm_id = ? AND account_type = 'CASH'
      LIMIT 1
    `).get(firm_id);

    if (!cashAccount) {
      return res.status(404).json({ error: 'Cash account not found' });
    }

    let query = `
      SELECT * FROM bank_transactions
      WHERE bank_account_id = ?
    `;
    const params = [cashAccount.id];

    if (fromDate) {
      query += ` AND transaction_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND transaction_date <= ?`;
      params.push(toDate);
    }

    query += ` ORDER BY transaction_date, id`;

    const transactions = db.prepare(query).all(...params);

    // Calculate running balance
    let balance = cashAccount.opening_balance;
    const cashbookWithBalance = transactions.map(txn => {
      balance += txn.type === 'CREDIT' ? txn.amount : -txn.amount;
      return {
        ...txn,
        balance
      };
    });

    res.json({
      account: cashAccount,
      opening_balance: cashAccount.opening_balance,
      transactions: cashbookWithBalance,
      closing_balance: balance
    });

  } catch (error) {
    console.error('Error fetching cashbook:', error);
    res.status(500).json({ error: 'Failed to fetch cashbook' });
  }
}

/**
 * Get bankbook
 */
export async function getBankbook(req, res) {
  try {
    const { firm_id } = req.user;
    const { accountId } = req.params;
    const { fromDate, toDate } = req.query;

    const account = db.prepare(`
      SELECT * FROM bank_accounts WHERE id = ? AND firm_id = ?
    `).get(accountId, firm_id);

    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    let query = `
      SELECT * FROM bank_transactions
      WHERE bank_account_id = ?
    `;
    const params = [accountId];

    if (fromDate) {
      query += ` AND transaction_date >= ?`;
      params.push(fromDate);
    }

    if (toDate) {
      query += ` AND transaction_date <= ?`;
      params.push(toDate);
    }

    query += ` ORDER BY transaction_date, id`;

    const transactions = db.prepare(query).all(...params);

    // Calculate running balance
    let balance = account.opening_balance;
    const bankbookWithBalance = transactions.map(txn => {
      balance += txn.type === 'CREDIT' ? txn.amount : -txn.amount;
      return {
        ...txn,
        balance
      };
    });

    res.json({
      account,
      opening_balance: account.opening_balance,
      transactions: bankbookWithBalance,
      closing_balance: balance
    });

  } catch (error) {
    console.error('Error fetching bankbook:', error);
    res.status(500).json({ error: 'Failed to fetch bankbook' });
  }
}
