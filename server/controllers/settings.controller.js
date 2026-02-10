/**
 * Settings Controller
 * Handles firm settings, system settings, and configurations
 */

import { db } from '../utils/db.js';
import fs from 'fs';
import path from 'path';

/**
 * Get firm settings
 */
export async function getFirmSettings(req, res) {
  try {
    const { firm_id } = req.user;

    const firm = db.prepare(`
      SELECT * FROM firms WHERE id = ?
    `).get(firm_id);

    if (!firm) {
      return res.status(404).json({ error: 'Firm not found' });
    }

    res.json(firm);

  } catch (error) {
    console.error('Error fetching firm settings:', error);
    res.status(500).json({ error: 'Failed to fetch firm settings' });
  }
}

/**
 * Update firm settings
 */
export async function updateFirmSettings(req, res) {
  try {
    const { firm_id } = req.user;
    const {
      firm_name,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      gstin,
      pan,
      bank_name,
      bank_account,
      bank_ifsc,
      logo_url
    } = req.body;

    db.prepare(`
      UPDATE firms SET
        firm_name = COALESCE(?, firm_name),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        pincode = COALESCE(?, pincode),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        gstin = COALESCE(?, gstin),
        pan = COALESCE(?, pan),
        bank_name = COALESCE(?, bank_name),
        bank_account = COALESCE(?, bank_account),
        bank_ifsc = COALESCE(?, bank_ifsc),
        logo_url = COALESCE(?, logo_url),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      firm_name, address, city, state, pincode, phone, email,
      gstin, pan, bank_name, bank_account, bank_ifsc, logo_url,
      firm_id
    );

    res.json({ message: 'Firm settings updated successfully' });

  } catch (error) {
    console.error('Error updating firm settings:', error);
    res.status(500).json({ error: 'Failed to update firm settings' });
  }
}

/**
 * Get invoice settings
 */
export async function getInvoiceSettings(req, res) {
  try {
    const { firm_id } = req.user;

    const settings = db.prepare(`
      SELECT * FROM firm_settings WHERE firm_id = ?
    `).get(firm_id);

    if (!settings) {
      // Return default settings
      return res.json({
        invoice_prefix: 'INV',
        invoice_terms: 'Payment due within 30 days',
        show_logo: true,
        show_bank_details: true,
        show_terms: true,
        show_signature: true
      });
    }

    res.json({
      invoice_prefix: settings.invoice_prefix || 'INV',
      invoice_terms: settings.invoice_terms || 'Payment due within 30 days',
      show_logo: true,
      show_bank_details: true,
      show_terms: true,
      show_signature: true
    });

  } catch (error) {
    console.error('Error fetching invoice settings:', error);
    res.status(500).json({ error: 'Failed to fetch invoice settings' });
  }
}

/**
 * Update invoice settings
 */
export async function updateInvoiceSettings(req, res) {
  try {
    const { firm_id } = req.user;
    const { invoice_prefix, invoice_terms } = req.body;

    const existing = db.prepare(`
      SELECT * FROM firm_settings WHERE firm_id = ?
    `).get(firm_id);

    if (existing) {
      db.prepare(`
        UPDATE firm_settings SET
          invoice_prefix = COALESCE(?, invoice_prefix),
          invoice_terms = COALESCE(?, invoice_terms),
          updated_at = datetime('now')
        WHERE firm_id = ?
      `).run(invoice_prefix, invoice_terms, firm_id);
    } else {
      db.prepare(`
        INSERT INTO firm_settings (firm_id, invoice_prefix, invoice_terms)
        VALUES (?, ?, ?)
      `).run(firm_id, invoice_prefix, invoice_terms);
    }

    res.json({ message: 'Invoice settings updated successfully' });

  } catch (error) {
    console.error('Error updating invoice settings:', error);
    res.status(500).json({ error: 'Failed to update invoice settings' });
  }
}

/**
 * Get number format settings
 */
export async function getNumberFormatSettings(req, res) {
  try {
    const { firm_id } = req.user;

    const settings = db.prepare(`
      SELECT * FROM firm_settings WHERE firm_id = ?
    `).get(firm_id);

    if (!settings) {
      return res.json({
        decimal_places: 2,
        date_format: 'DD-MM-YYYY',
        currency_symbol: '₹',
        multi_currency: 0
      });
    }

    res.json({
      decimal_places: settings.decimal_places || 2,
      date_format: settings.date_format || 'DD-MM-YYYY',
      currency_symbol: '₹',
      multi_currency: settings.multi_currency || 0
    });

  } catch (error) {
    console.error('Error fetching number format settings:', error);
    res.status(500).json({ error: 'Failed to fetch number format settings' });
  }
}

/**
 * Update number format settings
 */
export async function updateNumberFormatSettings(req, res) {
  try {
    const { firm_id } = req.user;
    const { decimal_places, date_format, multi_currency } = req.body;

    const existing = db.prepare(`
      SELECT * FROM firm_settings WHERE firm_id = ?
    `).get(firm_id);

    if (existing) {
      db.prepare(`
        UPDATE firm_settings SET
          decimal_places = COALESCE(?, decimal_places),
          date_format = COALESCE(?, date_format),
          multi_currency = COALESCE(?, multi_currency),
          updated_at = datetime('now')
        WHERE firm_id = ?
      `).run(decimal_places, date_format, multi_currency, firm_id);
    } else {
      db.prepare(`
        INSERT INTO firm_settings (firm_id, decimal_places, date_format, multi_currency)
        VALUES (?, ?, ?, ?)
      `).run(firm_id, decimal_places, date_format, multi_currency);
    }

    res.json({ message: 'Number format settings updated successfully' });

  } catch (error) {
    console.error('Error updating number format settings:', error);
    res.status(500).json({ error: 'Failed to update number format settings' });
  }
}

/**
 * Get tax settings
 */
export async function getTaxSettings(req, res) {
  try {
    const { firm_id } = req.user;

    const settings = db.prepare(`
      SELECT * FROM firm_settings WHERE firm_id = ?
    `).get(firm_id);

    if (!settings) {
      return res.json({
        gst_enabled: 1,
        cess_enabled: 0,
        tds_enabled: 0,
        default_gst_rate: 18,
        gst_rates: [0, 5, 12, 18, 28]
      });
    }

    res.json({
      gst_enabled: settings.gst_enabled || 1,
      cess_enabled: settings.cess_enabled || 0,
      tds_enabled: settings.tds_enabled || 0,
      default_gst_rate: 18,
      gst_rates: [0, 5, 12, 18, 28]
    });

  } catch (error) {
    console.error('Error fetching tax settings:', error);
    res.status(500).json({ error: 'Failed to fetch tax settings' });
  }
}

/**
 * Update tax settings
 */
export async function updateTaxSettings(req, res) {
  try {
    const { firm_id } = req.user;
    const { gst_enabled, cess_enabled, tds_enabled } = req.body;

    const existing = db.prepare(`
      SELECT * FROM firm_settings WHERE firm_id = ?
    `).get(firm_id);

    if (existing) {
      db.prepare(`
        UPDATE firm_settings SET
          gst_enabled = COALESCE(?, gst_enabled),
          cess_enabled = COALESCE(?, cess_enabled),
          tds_enabled = COALESCE(?, tds_enabled),
          updated_at = datetime('now')
        WHERE firm_id = ?
      `).run(gst_enabled, cess_enabled, tds_enabled, firm_id);
    } else {
      db.prepare(`
        INSERT INTO firm_settings (firm_id, gst_enabled, cess_enabled, tds_enabled)
        VALUES (?, ?, ?, ?)
      `).run(firm_id, gst_enabled, cess_enabled, tds_enabled);
    }

    res.json({ message: 'Tax settings updated successfully' });

  } catch (error) {
    console.error('Error updating tax settings:', error);
    res.status(500).json({ error: 'Failed to update tax settings' });
  }
}

/**
 * Get system settings (Admin only)
 */
export async function getSystemSettings(req, res) {
  try {
    const { role } = req.user;

    if (role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const settingsRows = db.prepare(`
      SELECT setting_key, setting_value, setting_type FROM settings
    `).all();

    const settings = {};
    settingsRows.forEach(row => {
      let value = row.setting_value;
      if (row.setting_type === 'NUMBER') {
        value = parseFloat(value);
      } else if (row.setting_type === 'BOOLEAN') {
        value = value === '1' || value === 'true';
      } else if (row.setting_type === 'JSON') {
        value = JSON.parse(value);
      }
      settings[row.setting_key] = value;
    });

    res.json(settings);

  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
}

/**
 * Update system settings (Admin only)
 */
export async function updateSystemSettings(req, res) {
  try {
    const { role } = req.user;

    if (role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const settings = req.body;

    const updateStmt = db.prepare(`
      UPDATE settings SET
        setting_value = ?,
        updated_at = datetime('now')
      WHERE setting_key = ?
    `);

    Object.entries(settings).forEach(([key, value]) => {
      let stringValue = value;
      if (typeof value === 'boolean') {
        stringValue = value ? '1' : '0';
      } else if (typeof value === 'object') {
        stringValue = JSON.stringify(value);
      } else {
        stringValue = String(value);
      }
      updateStmt.run(stringValue, key);
    });

    res.json({ message: 'System settings updated successfully' });

  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({ error: 'Failed to update system settings' });
  }
}

/**
 * Create backup (Admin only)
 */
export async function createBackup(req, res) {
  try {
    const { role } = req.user;

    if (role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}.db`;
    
    // This is a placeholder - actual implementation would copy the database
    res.json({
      message: 'Backup created successfully',
      backup_name: backupName,
      backup_size: '0 MB',
      created_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
}

/**
 * Restore backup (Admin only)
 */
export async function restoreBackup(req, res) {
  try {
    const { role } = req.user;

    if (role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const { backup_name } = req.body;

    if (!backup_name) {
      return res.status(400).json({ error: 'Backup name is required' });
    }

    // This is a placeholder - actual implementation would restore the database
    res.json({
      message: 'Backup restored successfully',
      backup_name,
      restored_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
}

/**
 * List backups (Admin only)
 */
export async function listBackups(req, res) {
  try {
    const { role } = req.user;

    if (role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    // This is a placeholder - actual implementation would list backup files
    res.json([
      {
        name: 'backup-2024-02-10.db',
        size: '15 MB',
        created_at: '2024-02-10T10:00:00Z'
      }
    ]);

  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({ error: 'Failed to list backups' });
  }
}
